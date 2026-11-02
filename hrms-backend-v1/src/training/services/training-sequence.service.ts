import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrainingSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNextCode(
    companyId: string,
    entityType: 'TRAINING_PLAN' | 'TRAINING_PROGRAM' | 'POSITION_CHANGE' | 'COMPETENCY',
    prefix: string,
  ): Promise<string> {
    const year = new Date().getFullYear();

    const result = await this.prisma.$queryRaw<Array<{ currentValue: number }>>`
      INSERT INTO "CompanySequence" ("id", "companyId", "entityType", "year", "currentValue", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${companyId}, ${entityType}, ${year}, 1, NOW(), NOW())
      ON CONFLICT ("companyId", "entityType", "year")
      DO UPDATE SET "currentValue" = "CompanySequence"."currentValue" + 1, "updatedAt" = NOW()
      RETURNING "currentValue";
    `;

    const seqNum = result[0]?.currentValue || 1;
    const padded = String(seqNum).padStart(4, '0');
    return `${prefix}-${year}-${padded}`;
  }
}
