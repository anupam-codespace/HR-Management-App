"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  Search, Upload, Plus, MoreVertical, Eye, Download, 
  ShieldCheck, XCircle, Clock, CheckCircle2, FileText,
  AlertCircle, Loader2, Pencil, Trash2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle 
} from "@/components/ui/sheet";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

import { useViewMode } from "@/context/ViewModeContext";

export default function EnterpriseAdminDocumentHub() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [redirecting, setRedirecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Filter dropdown states
  const [selectedDept, setSelectedDept] = useState("all-dept");
  const [selectedCategory, setSelectedCategory] = useState("all-type");
  const [selectedStatus, setSelectedStatus] = useState("all-status");

  // Request document form states
  const [requestEmployeeId, setRequestEmployeeId] = useState("");
  const [requestDocName, setRequestDocName] = useState("");
  const [requestCategory, setRequestCategory] = useState("COMPLIANCE");

  // Upload document form states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: "", category: "COMPANY", isGlobal: true, employeeId: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Edit and Delete states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", category: "COMPANY", isGlobal: true, employeeId: "" });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { activeRole, isLoading: isLoadingProfile } = useViewMode();

  // Redirect employee users back to the employee documents page
  useEffect(() => {
    if (!isLoadingProfile && activeRole && activeRole === "EMPLOYEE") {
      setRedirecting(true);
      router.push("/workspace/documents");
    }
  }, [activeRole, isLoadingProfile, router]);

  // Fetch all documents from database
  const { data: documents, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["adminDocuments"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/documents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  // Fetch employees list for dropdown when requesting document
  const { data: employees } = useQuery({
    queryKey: ["employeesList"],
    queryFn: async () => {
      const token = localStorage.getItem("hrms_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/employees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  // Request document mutation
  const requestMutation = useMutation({
    mutationFn: async (payload: { employeeId: string; name: string; category: string }) => {
      const token = localStorage.getItem("hrms_token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/documents/request`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocuments"] });
      setIsRequestModalOpen(false);
      setRequestEmployeeId("");
      setRequestDocName("");
      setRequestCategory("COMPLIANCE");
    },
  });

  // Verify/Reject status mutation
  const statusMutation = useMutation({
    mutationFn: async (payload: { documentId: string; status: string; rejectionReason?: string }) => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/documents/${payload.documentId}/status`,
        { status: payload.status, rejectionReason: payload.rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocuments"] });
      setSelectedDoc(null);
      setIsRejectModalOpen(false);
      setRejectionReason("");
    },
  });

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadForm.name);
      formData.append("category", uploadForm.category);
      if (!uploadForm.isGlobal && uploadForm.employeeId) {
        formData.append("employeeId", uploadForm.employeeId);
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/documents/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });

      alert("Document uploaded successfully!");
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadForm({ name: "", category: "COMPANY", isGlobal: true, employeeId: "" });
      queryClient.invalidateQueries({ queryKey: ["adminDocuments"] });
    } catch (err) {
      console.error(err);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/documents/${documentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocuments"] });
      setSelectedDoc(null);
      setIsDeleteConfirmOpen(false);
      alert("Document deleted successfully!");
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to delete document.");
    }
  });

  // Edit document details mutation
  const editMutation = useMutation({
    mutationFn: async (payload: { name: string; category: string; employeeId: string | null }) => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/documents/${selectedDoc.id}/details`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocuments"] });
      setSelectedDoc(null);
      setIsEditOpen(false);
      alert("Document updated successfully!");
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to update document.");
    }
  });

  // If redirecting, show a loading state (after all hooks are called)
  if (redirecting) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // --- UI HELPERS ---
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "VERIFIED": return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"><CheckCircle2 className="w-3 h-3 mr-1"/> Verified</Badge>;
      case "SUBMITTED": return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"><Upload className="w-3 h-3 mr-1"/> Submitted</Badge>;
      case "UNDER_REVIEW": return <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50"><Clock className="w-3 h-3 mr-1"/> Under Review</Badge>;
      case "REQUESTED": return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50"><AlertCircle className="w-3 h-3 mr-1"/> Requested</Badge>;
      case "REJECTED": return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      case "EXPIRED": return <Badge className="bg-slate-800 text-white border-slate-900 hover:bg-slate-800"><AlertCircle className="w-3 h-3 mr-1"/> Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalDocs = documents?.length || 0;
  const pendingReview = documents?.filter((d: any) => d.status === "SUBMITTED").length || 0;
  const expiringSoon = 0;
  const rejectedDocs = documents?.filter((d: any) => d.status === "REJECTED").length || 0;

  const departmentsList = Array.from(
    new Set((documents || []).map((doc: any) => doc.employee?.department?.name).filter(Boolean))
  );

  const filteredDocs = (documents || []).filter((doc: any) => {
    const matchesSearch = 
      (doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}` : "All Employees").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.employee?.employeeCode || "Global").toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "all-dept" || doc.employee?.department?.name === selectedDept || (!doc.employee && selectedDept === "all-dept");
    const matchesCategory = selectedCategory === "all-type" || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === "all-status" || doc.status === selectedStatus;

    return matchesSearch && matchesDept && matchesCategory && matchesStatus;
  });

  const employeeSelectItems = (employees || []).map((emp: any) => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode || "N/A"})`
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* 2. MAIN HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employee Documents</h1>
          <p className="text-slate-500 mt-1">View and manage all employee documents</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsUploadOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9">
            <Upload className="w-4 h-4 mr-2" /> Upload Document
          </Button>
          <Button onClick={() => setIsRequestModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm h-9">
            <Plus className="w-4 h-4 mr-2" /> Request Document
          </Button>
        </div>
      </div>
          
          {/* 3. STATISTICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Documents</p>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-slate-900">{totalDocs}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">All time records</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-orange-400"></div>
              <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider">Pending Review</p>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-slate-900">{pendingReview}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Requires your attention</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
              <p className="text-sm font-semibold text-rose-600 uppercase tracking-wider">Expiring Soon</p>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-slate-900">{expiringSoon}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Within next 30 days</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-rose-700"></div>
              <p className="text-sm font-semibold text-rose-700 uppercase tracking-wider">Rejected</p>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-slate-900">{rejectedDocs}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Needs re-upload</p>
            </div>
          </div>

          {/* 4. SEARCH AND FILTERS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Search employee, document..." className="pl-9 bg-slate-50 border-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              
              <Select value={selectedDept} onValueChange={(val) => val && setSelectedDept(String(val))}>
                <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-dept">All Departments</SelectItem>
                  {departmentsList.map((dept: any) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={(val) => val && setSelectedCategory(String(val))}>
                <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200"><SelectValue placeholder="Document Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-type">All Categories</SelectItem>
                  <SelectItem value="EMPLOYMENT">Employment</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="COMPANY">Company</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(val) => val && setSelectedStatus(String(val))}>
                <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Statuses</SelectItem>
                  <SelectItem value="REQUESTED">Requested</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" className="border-slate-200 text-slate-600 bg-white hover:bg-slate-50 shrink-0">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>

          {/* 5 & 6. EMPLOYEE DOCUMENT TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[250px]">Employee</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded On</TableHead>
                  <TableHead>Expires On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingDocs ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                    </TableCell>
                  </TableRow>
                ) : filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      No documents found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc: any) => {
                    const empName = doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}` : "All Employees";
                    const empCode = doc.employee?.employeeCode || "Global";
                    const avatar = doc.employee 
                      ? `${doc.employee.firstName?.charAt(0)}${doc.employee.lastName?.charAt(0) || ""}`.toUpperCase()
                      : "💼";
                    const uploadedDate = doc.status === "REQUESTED" ? "—" : new Date(doc.updatedAt || doc.createdAt).toLocaleDateString();
                    return (
                      <TableRow key={doc.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">{avatar}</div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{empName}</p>
                              <p className="text-xs text-slate-500 font-mono">{empCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{doc.name}</TableCell>
                        <TableCell className="text-slate-500 text-sm capitalize">{doc.category.toLowerCase()}</TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{uploadedDate}</TableCell>
                        <TableCell className="text-slate-500 text-sm">—</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50" onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}>
                              <Eye className="w-4 h-4 mr-1.5" /> View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

      {/* 7, 8, 9, 10. DOCUMENT REVIEW PANEL (Right Drawer) */}
      <Sheet open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 flex flex-col bg-slate-50">
          
          {/* Drawer Header */}
          <div className="p-6 bg-white border-b border-slate-200 shrink-0">
            <SheetHeader>
              <SheetTitle className="text-xl flex items-center">
                Review Document
                {selectedDoc && <span className="ml-3">{getStatusBadge(selectedDoc.status)}</span>}
              </SheetTitle>
            </SheetHeader>
            
            {selectedDoc && (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-lg font-bold">
                    {selectedDoc.employee 
                      ? `${selectedDoc.employee.firstName?.charAt(0)}${selectedDoc.employee.lastName?.charAt(0) || ""}`.toUpperCase()
                      : "💼"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedDoc.employee 
                        ? `${selectedDoc.employee.firstName} ${selectedDoc.employee.lastName}`
                        : "All Employees (Company Policy)"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedDoc.employee 
                        ? `${selectedDoc.employee.employeeCode || "N/A"} • ${selectedDoc.employee.department?.name || "No Department"}`
                        : "Company-wide document visible to all employees"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Scrollable Body */}
          {selectedDoc && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Document Details Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 grid grid-cols-2 gap-y-4 gap-x-8">
                <div><p className="text-xs font-medium text-slate-400 uppercase">Document Name</p><p className="font-semibold text-slate-900 mt-1">{selectedDoc.name}</p></div>
                <div><p className="text-xs font-medium text-slate-400 uppercase">Category</p><p className="font-semibold text-slate-900 mt-1 capitalize">{selectedDoc.category.toLowerCase()}</p></div>
                <div><p className="text-xs font-medium text-slate-400 uppercase">Uploaded On</p><p className="font-semibold text-slate-900 mt-1">{selectedDoc.status === "REQUESTED" ? "—" : new Date(selectedDoc.updatedAt || selectedDoc.createdAt).toLocaleDateString()}</p></div>
                <div><p className="text-xs font-medium text-slate-400 uppercase">Rejection Reason</p><p className="text-sm text-rose-600 mt-1">{selectedDoc.rejectionReason || "None"}</p></div>
              </div>

              {/* Document Preview Area */}
              {selectedDoc.fileUrl ? (
                <div className="bg-slate-200 rounded-xl border border-slate-300 aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden group">
                  <FileText className="w-16 h-16 text-slate-400 mb-3" />
                  <p className="text-slate-500 font-medium">Secure Document Preview Available</p>
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="bg-white hover:bg-slate-100 shadow-sm text-slate-700"
                      onClick={() => window.open(selectedDoc.fileUrl, "_blank")}
                    >
                      Open Document
                    </Button>
                    <a 
                      href={selectedDoc.fileUrl} 
                      download 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 aspect-[4/3] flex flex-col items-center justify-center p-6 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-slate-600 font-medium">No Document Uploaded</p>
                  <p className="text-xs text-slate-400 mt-1">This document has been requested, but the employee has not uploaded the file yet.</p>
                </div>
              )}

              {/* Admin Actions Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Control</h4>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setEditForm({
                        name: selectedDoc.name,
                        category: selectedDoc.category,
                        isGlobal: !selectedDoc.employeeId,
                        employeeId: selectedDoc.employeeId || "",
                      });
                      setIsEditOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Edit Details
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Document
                  </Button>
                </div>
              </div>

            </div>
          )}

          {/* Drawer Footer (Actions) */}
          {selectedDoc?.status === "SUBMITTED" && (
            <div className="p-6 bg-white border-t border-slate-200 flex justify-between shrink-0">
              <Button 
                variant="outline" 
                className="border-rose-200 text-rose-600 hover:bg-rose-50" 
                onClick={() => setIsRejectModalOpen(true)}
                disabled={statusMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject Document
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={() => statusMutation.mutate({ documentId: selectedDoc.id, status: "VERIFIED" })}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                Verify Document
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 11. REQUEST DOCUMENT MODAL */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Employee</label>
              <Select value={requestEmployeeId} onValueChange={(val) => val && setRequestEmployeeId(String(val))} items={employeeSelectItems}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {(employees || []).map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || "N/A"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Document Name</label>
              <Input 
                placeholder="e.g. Degree Certificate, PAN Card, Passport" 
                value={requestDocName} 
                onChange={(e) => setRequestDocName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <Select value={requestCategory} onValueChange={(val) => val && setRequestCategory(String(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="EMPLOYMENT">Employment</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={!requestEmployeeId || !requestDocName || requestMutation.isPending}
              onClick={() => requestMutation.mutate({
                employeeId: requestEmployeeId,
                name: requestDocName,
                category: requestCategory
              })}
            >
              {requestMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECT CONFIRMATION MODAL */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Reject Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reason for rejection</label>
              <Textarea 
                placeholder="e.g. Document is blurry or incomplete." 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <p className="text-xs text-slate-500">The employee will receive a notification with this reason.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              disabled={!rejectionReason || statusMutation.isPending}
              onClick={() => statusMutation.mutate({ documentId: selectedDoc?.id, status: "REJECTED", rejectionReason })}
            >
              {statusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPLOAD DOCUMENT MODAL */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Document Name</label>
              <Input
                placeholder="e.g. Employee Handbook, NDA Contract"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                className="w-full border rounded-md p-2 mt-1 text-sm bg-white border-slate-200 outline-none focus:border-indigo-500"
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
              >
                <option value="COMPANY">Company Policy / Handbook</option>
                <option value="COMPLIANCE">Identity & Compliance</option>
                <option value="EMPLOYMENT">Employment Record</option>
                <option value="PERSONAL">Personal File</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isGlobal"
                checked={uploadForm.isGlobal}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setUploadForm({
                    ...uploadForm,
                    isGlobal: isChecked,
                    category: isChecked ? "COMPANY" : "EMPLOYMENT",
                  });
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="isGlobal" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Share with everyone (Company-wide Document)
              </label>
            </div>

            {!uploadForm.isGlobal && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Select Employee</label>
                <select
                  className="w-full border rounded-md p-2 mt-1 text-sm bg-white border-slate-200 outline-none focus:border-indigo-500"
                  value={uploadForm.employeeId}
                  onChange={(e) => setUploadForm({ ...uploadForm, employeeId: e.target.value })}
                >
                  <option value="">-- Choose Employee --</option>
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Select File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500 text-center px-4">
                      {uploadFile ? (
                        <span className="font-semibold text-emerald-600">{uploadFile.name}</span>
                      ) : (
                        <span>Click to select document file</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG, or DOCX (Max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadOpen(false);
                setUploadFile(null);
                setUploadForm({ name: "", category: "COMPANY", isGlobal: true, employeeId: "" });
              }}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadSubmit}
              disabled={!uploadForm.name || !uploadFile || (!uploadForm.isGlobal && !uploadForm.employeeId) || uploading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? "Uploading..." : "Upload & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-600">Delete Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong>{selectedDoc?.name}</strong>? This action is permanent and will delete the file from the database and S3 storage.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => deleteMutation.mutate(selectedDoc.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DOCUMENT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Document Name</label>
              <Input
                placeholder="e.g. Employee Handbook"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                className="w-full border rounded-md p-2 mt-1 text-sm bg-white border-slate-200 outline-none focus:border-indigo-500"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                <option value="COMPANY">Company Policy / Handbook</option>
                <option value="COMPLIANCE">Identity & Compliance</option>
                <option value="EMPLOYMENT">Employment Record</option>
                <option value="PERSONAL">Personal File</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="editIsGlobal"
                checked={editForm.isGlobal}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setEditForm({
                    ...editForm,
                    isGlobal: isChecked,
                    category: isChecked ? "COMPANY" : "EMPLOYMENT",
                  });
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="editIsGlobal" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Share with everyone (Company-wide Document)
              </label>
            </div>

            {!editForm.isGlobal && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Select Employee</label>
                <select
                  className="w-full border rounded-md p-2 mt-1 text-sm bg-white border-slate-200 outline-none focus:border-indigo-500"
                  value={editForm.employeeId}
                  onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                >
                  <option value="">-- Choose Employee --</option>
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={() => editMutation.mutate({
                name: editForm.name,
                category: editForm.category,
                employeeId: editForm.isGlobal ? null : editForm.employeeId,
              })}
              disabled={!editForm.name || (!editForm.isGlobal && !editForm.employeeId) || editMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}