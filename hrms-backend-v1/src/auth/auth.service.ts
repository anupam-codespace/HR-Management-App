// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterWizardDto } from './dto/register-wizard.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async checkRegistrationEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.prisma.employee.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    return { available: !existingUser };
  }

  async registerWizard(dto: RegisterWizardDto) {
    dto.adminEmail = dto.adminEmail.trim().toLowerCase();
    dto.email = dto.email.trim().toLowerCase();

    // 1. Check if the admin email is already registered
    const existingUser = await this.prisma.employee.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existingUser) {
      throw new ConflictException('Admin email already exists');
    }

    // 2. Hash the user's custom password (or fallback to default if not provided)
    const passwordToHash = dto.adminPassword || 'SecurePassword123!';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    // 3. Split the full name into first and last

    // 4. THE MASSIVE TRANSACTION
    // We create the Company, the Settings, the Departments, the Roles, and the Admin Employee all at once!
    // Inside registerWizard function:
    const compPrefix =
      dto.employeeIdPrefix ||
      dto.companyName
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 3)
        .toUpperCase() ||
      'EMP';
    const digits = dto.employeeIdDigits ? Number(dto.employeeIdDigits) : 3;
    const format = dto.employeeIdFormat || '{PREFIX}-{DEPT}-{NUMBER}';
    const currentYear = new Date().getFullYear().toString();
    const shortYear = currentYear.slice(-2);
    const seq = String(1).padStart(digits, '0');

    let generatedEmployeeCode = format
      .replace(/\{PREFIX\}|\[PREFIX\]/gi, compPrefix)
      .replace(/\{DEPT\}|\[DEPT\]/gi, 'GEN')
      .replace(/\{YEAR\}|\[YEAR\]/gi, currentYear)
      .replace(/\{YY\}|\[YY\]/gi, shortYear);

    if (/\{NUMBER\}|\[NUMBER\]/gi.test(generatedEmployeeCode)) {
      generatedEmployeeCode = generatedEmployeeCode.replace(
        /\{NUMBER\}|\[NUMBER\]/gi,
        seq,
      );
    } else {
      generatedEmployeeCode = `${generatedEmployeeCode}-${seq}`;
    }

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        industry: dto.industry,
        size: dto.companySize,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        gstin: dto.gstin,
        pan: dto.pan,
        cin: dto.cin,
        subscription: 'FREE_TRIAL',

        employees: {
          create: {
            firstName: dto.adminFirstName,
            lastName: dto.adminLastName,
            email: dto.adminEmail,
            phone: dto.adminPhone,
            password: hashedPassword, // <-- Changed from passwordHash to password
            role: 'SUPER_ADMIN',
            employeeCode: generatedEmployeeCode,
          },
        },
        settings: {
          create: {
            companyName: dto.companyName,
            industry: dto.industry,
            website: dto.website,
            officialEmail: dto.email,
            officialPhone: dto.phone,
            timeZone: dto.timeZone || 'Asia/Kolkata',
            themeColor: dto.themeColor || '#10b981',
            attendanceMethod: dto.attendanceMethod || 'GPS_OR_WIFI',
            employeeIdFormat: format,
            employeeIdPrefix: compPrefix,
            employeeIdDigits: digits,
            workingDays: dto.workDays || [
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
            ],
            officeStartTime: dto.shiftStartTime || '09:00',
            officeEndTime: dto.shiftEndTime || '18:00',
            enableGps: dto.attendanceMethod
              ? dto.attendanceMethod === 'GPS' ||
                dto.attendanceMethod === 'GPS_OR_WIFI'
              : true,
          },
        },

        // 2. Auto-create Organizational Lists
        departments: {
          create: dto.departments?.map((name) => ({ name })) || [],
        },
        roles: {
          create: dto.roles?.map((name) => ({ name })) || [],
        },
        // The setup wizard calls these job titles "roles", but recruitment
        // requires Designation records (with IDs) when creating requisitions.
        designations: {
          create:
            dto.roles?.map((name) => ({
              name,
              baseRole: 'EMPLOYEE',
            })) || [],
        },
        branches: {
          create: dto.branches?.map((name) => ({ name })) || [],
        },
        leavePolicies: {
          create:
            dto.leavePolicies && dto.leavePolicies.length > 0
              ? dto.leavePolicies.map((name) => {
                  let type = 'UNPAID';
                  let days = 0;
                  const upperName = name.toUpperCase();
                  if (upperName.includes('CASUAL')) {
                    type = 'CASUAL';
                    days = 12;
                  } else if (
                    upperName.includes('MEDICAL') ||
                    upperName.includes('SICK')
                  ) {
                    type = 'MEDICAL';
                    days = 10;
                  } else if (
                    upperName.includes('EARNED') ||
                    upperName.includes('ANNUAL')
                  ) {
                    type = 'EARNED';
                    days = 15;
                  } else if (upperName.includes('MATERNITY')) {
                    type = 'MATERNITY';
                    days = 84;
                  } else if (upperName.includes('PATERNITY')) {
                    type = 'PATERNITY';
                    days = 14;
                  } else if (upperName.includes('COMP')) {
                    type = 'COMP_OFF';
                    days = 0;
                  } else if (upperName.includes('UNPAID')) {
                    type = 'UNPAID';
                    days = 365;
                  }

                  return {
                    name:
                      name.endsWith('Leave') || name.endsWith('Off')
                        ? name
                        : `${name} Leave`,
                    type: type as any,
                    daysPerYear: days,
                  };
                })
              : [
                  { name: 'Casual Leave', type: 'CASUAL', daysPerYear: 12 },
                  { name: 'Medical Leave', type: 'MEDICAL', daysPerYear: 10 },
                  { name: 'Earned Leave', type: 'EARNED', daysPerYear: 15 },
                ],
        },
        shifts: {
          create:
            dto.shifts?.map((name) => ({
              name,
              startTime: dto.shiftStartTime || '09:00',
              endTime: dto.shiftEndTime || '18:00',
            })) || [],
        },
      },

      // MUST BE OUTSIDE THE 'data' BLOCK!
      include: {
        employees: true,
      },
    });

    const newAdmin = company.employees[0];

    // 5. Process and Invite Additional Employees (from Bulk Excel/CSV upload or comma-separated emails)
    const employeesToInvite: Array<{
      firstName?: string;
      lastName?: string;
      email: string;
      phone?: string;
      department?: string;
      designation?: string;
      role?: string;
    }> = [];

    // Add structured employees from bulk upload
    if (dto.invitedEmployees && Array.isArray(dto.invitedEmployees)) {
      for (const emp of dto.invitedEmployees) {
        if (emp.email && emp.email.trim()) {
          employeesToInvite.push({
            firstName: emp.firstName?.trim() || '',
            lastName: emp.lastName?.trim() || '',
            email: emp.email.trim().toLowerCase(),
            phone: emp.phone?.trim(),
            department: emp.department?.trim(),
            designation: emp.designation?.trim(),
            role: emp.role?.trim(),
          });
        }
      }
    }

    // Add comma-separated emails from textarea
    if (dto.inviteEmails && typeof dto.inviteEmails === 'string') {
      const parsedEmails = dto.inviteEmails
        .split(/[,;\n]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes('@'));

      for (const email of parsedEmails) {
        if (!employeesToInvite.some((e) => e.email === email)) {
          employeesToInvite.push({
            firstName: 'Team',
            lastName: 'Member',
            email,
          });
        }
      }
    }

    // Deduplicate and exclude the Admin email
    const adminEmailNorm = dto.adminEmail.trim().toLowerCase();
    const uniqueInvites = employeesToInvite.filter(
      (item, index, self) =>
        item.email !== adminEmailNorm &&
        index === self.findIndex((t) => t.email === item.email),
    );

    if (uniqueInvites.length > 0) {
      // Fetch departments for mapping
      const companyDepts = await this.prisma.department.findMany({
        where: { companyId: company.id },
      });
      const deptMap = new Map<string, { id: string; name: string }>();
      companyDepts.forEach((d) => {
        deptMap.set(d.name.trim().toLowerCase(), d);
      });

      const tempPasswordHash = await bcrypt.hash('Welcome123!', 10);

      for (let i = 0; i < uniqueInvites.length; i++) {
        const inv = uniqueInvites[i];
        try {
          // Check if employee with this email already exists globally
          const alreadyExists = await this.prisma.employee.findUnique({
            where: { email: inv.email },
          });
          if (alreadyExists) continue;

          let deptId: string | null = null;

          if (inv.department) {
            const matchedDept = deptMap.get(inv.department.toLowerCase());
            if (matchedDept) {
              deptId = matchedDept.id;
            }
          }

          const inviteToken = crypto.randomBytes(32).toString('hex');

          let assignedRole: any = 'EMPLOYEE';
          if (inv.role) {
            const upperRole = inv.role.toUpperCase().replace(/\s+/g, '_');
            if (
              ['HR_HEAD', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN'].includes(
                upperRole,
              )
            ) {
              assignedRole = upperRole;
            }
          }

          const fName = inv.firstName || inv.email.split('@')[0] || 'Team';
          const lName = inv.lastName || 'Member';

          const createdEmp = await this.prisma.employee.create({
            data: {
              companyId: company.id,
              firstName: fName,
              lastName: lName,
              email: inv.email,
              phone: inv.phone || null,
              password: tempPasswordHash,
              role: assignedRole,
              employeeCode: null, // Defer ID generation until onboarding completion
              employmentStatus: 'INVITED',
              departmentId: deptId,
              inviteToken: inviteToken,
              resetPasswordExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });

          // Initialize Onboarding Case & standard checklist tasks
          try {
            const newCase = await this.prisma.onboardingCase.create({
              data: {
                companyId: company.id,
                employeeId: createdEmp.id,
                status: 'INVITED',
                offerSigned: false,
                bgvStatus: 'PENDING',
              },
            });

            const defaultTasks = [
              {
                title: 'Complete Profile & Contact Details',
                description:
                  'Provide your personal phone number, blood group, emergency contacts and address.',
                requiredForActivation: true,
              },
              {
                title: 'Digital Offer Letter Acceptance',
                description:
                  'Read, acknowledge, and digitally accept the employment offer terms.',
                requiredForActivation: true,
              },
              {
                title: 'Upload KYC & Identity Documents',
                description:
                  'Submit government-issued ID (Aadhaar / National ID / Passport) and PAN card.',
                requiredForActivation: true,
              },
              {
                title: 'Bank & Statutory Details Submission',
                description:
                  'Provide bank account, IFSC, and PF/UAN details for automated payroll processing.',
                requiredForActivation: true,
              },
              {
                title: 'Company Policy & Security Orientation',
                description:
                  'Review the Employee Handbook, code of conduct, and workplace guidelines.',
                requiredForActivation: false,
              },
            ];

            for (const t of defaultTasks) {
              await this.prisma.task.create({
                data: {
                  companyId: company.id,
                  employeeId: createdEmp.id,
                  onboardingCaseId: newCase.id,
                  title: t.title,
                  description: t.description,
                  source: 'TEMPLATE',
                  requiredForActivation: t.requiredForActivation,
                  status: 'PENDING',
                },
              });
            }
          } catch (caseErr) {
            console.error(
              'Failed to initialize onboarding case for wizard invite:',
              caseErr,
            );
          }

          // Send onboarding invitation email
          await this.emailService.sendEmployeeInvitationEmail(
            inv.email,
            fName,
            null,
            inviteToken,
          );

          await this.auditService.logAction(
            company.id,
            newAdmin.id,
            'CREATE',
            'Employee',
            createdEmp.id,
            null,
            {
              email: createdEmp.email,
              role: createdEmp.role,
              employeeCode: createdEmp.employeeCode,
            },
          );
        } catch (inviteErr) {
          console.error(
            `Failed to onboard invited employee (${inv.email}):`,
            inviteErr,
          );
        }
      }
    }

    // 6. Generate their JWT token to log them in automatically
    const payload = {
      sub: newAdmin.id,
      email: newAdmin.email,
      companyId: company.id,
      role: newAdmin.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      message: 'Workspace successfully configured!',
      invitedCount: uniqueInvites.length,
    };
  }

  // ... KEEP YOUR EXISTING login() FUNCTION EXACTLY AS IT IS BELOW ...
  async login(email: string, pass: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.employee.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Log user login activity
    await this.auditService.logAction(
      user.companyId,
      user.id,
      'LOGIN',
      'Employee',
      user.id,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async logout(employeeId: string, companyId: string) {
    await this.auditService.logAction(
      companyId,
      employeeId,
      'LOGOUT',
      'Employee',
      employeeId,
    );
    return { success: true };
  }

  async getProfile(employeeId: string) {
    const profile = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        phone: true,
        bloodGroup: true,
        profilePhoto: true,
        employeeCode: true,
        joiningDate: true,
        themePreference: true,
        timeFormat: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        designation: true,
        notificationSettings: true,
        devices: true,
        company: {
          include: {
            settings: true,
            departments: true,
            roles: true,
          },
        },
      },
    });

    if (!profile) {
      throw new UnauthorizedException('User not found');
    }

    // Format profileImage URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const profileImage = profile.profilePhoto
      ? `${backendUrl}${profile.profilePhoto}`
      : null;

    return {
      ...profile,
      profileImage,
    };
  }

  async setPassword(dto: SetPasswordDto) {
    // 1. Find the employee by their unique invite token
    const employee = await this.prisma.employee.findUnique({
      where: { inviteToken: dto.token },
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    if (
      employee.resetPasswordExpires &&
      new Date() > new Date(employee.resetPasswordExpires)
    ) {
      throw new UnauthorizedException(
        'Invitation token has expired. Please request a new invitation link.',
      );
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Update the password and clear the token so it can't be used again
    const updatedEmployee = await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: hashedPassword,
        inviteToken: null,
        resetPasswordExpires: null,
      },
    });

    // 4. Generate a JWT token so they are logged in instantly
    const payload = {
      sub: updatedEmployee.id,
      email: updatedEmployee.email,
      companyId: updatedEmployee.companyId,
      role: updatedEmployee.role,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      message: 'Password set successfully!',
    };
  }

  async changePassword(employeeId: string, dto: ChangePasswordDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new UnauthorizedException('Employee not found');
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      employee.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(email: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('A valid email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const employee = await this.prisma.employee.findUnique({
      where: { email: normalizedEmail },
    });

    // Security best practice: Don't reveal if the email exists or not to prevent user enumeration
    if (!employee) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    // 1. Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash it before saving to the DB (Security best practice)
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 3. Set expiration (e.g., 15 minutes from now)
    const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        resetPasswordToken: passwordResetToken,
        resetPasswordExpires: passwordResetExpires,
      },
    });

    // 4. Send Email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await this.emailService.sendPasswordResetEmail(normalizedEmail, resetUrl);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Invalid or missing reset token');
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // 1. Hash the incoming token so we can compare it to the DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find the user with this token, ensuring it hasn't expired
    const employee = await this.prisma.employee.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() }, // Check if expiration is greater than right now
      },
    });

    if (!employee) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    // 3. Hash the new password and clear the tokens
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // 4. Record audit log
    await this.auditService.logAction(
      employee.companyId,
      employee.id,
      'UPDATE',
      'Employee',
      employee.id,
      null,
      { field: 'password', reason: 'PASSWORD_RESET' },
    );

    return { message: 'Password has been reset successfully' };
  }

  async getPermissions(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        designation: true,
      },
    });
    return { designation: employee?.designation || null };
  }
}
