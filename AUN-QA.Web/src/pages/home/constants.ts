enum EvidenceStatus {
  VERIFIED = "Verified",
  PENDING = "Pending",
  REJECTED = "Rejected",
}

type EvidenceSource = "Upload" | "Import";

enum PDCAStage {
  PLAN = "Plan",
  DO = "Do",
  CHECK = "Check",
  ACT = "Act",
}

interface EvidenceHistory {
  version: number;
  updatedBy: string;
  updatedAt: string;
  changeNote: string;
}

interface EvidenceMetadata {
  issueDate: string;
  issuingAuthority: string;
  expirationDate?: string;
  isDigitallySigned?: boolean;
  pdcaStages: PDCAStage[]; // Updated to support multiple stages
  fileHash?: string;
}

interface Evidence {
  id: string;
  fileName: string;
  fileType: "pdf" | "xlsx" | "img" | "docx";
  metadata: EvidenceMetadata;
  version: number;
  uploader: string;
  status: EvidenceStatus;
  source: EvidenceSource;
  rejectionReason?: string;
  tags: string[];
  history: EvidenceHistory[];
}

interface KPI {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
}

enum StandardType {
  AUN = "AUN-QA",
  MOET = "MOET",
  ABET = "ABET",
}

interface Standard {
  id: string;
  parentId?: string;
  code: string;
  name: string;
  type: StandardType;
  description?: string;
  requiredEvidence?: string[];
  targetValue?: number;
  currentValue?: number;
  unit?: string;
}

enum Role {
  ADMIN = "ADMIN",
  COUNCIL = "COUNCIL",
  SECRETARIAT = "SECRETARIAT",
  PROVIDER = "PROVIDER",
}

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  roles: Role[];
  status: "ACTIVE" | "LOCKED";
  lastLogin: string;
  avatar?: string;
}

// Full AUN-QA Standards (Programme Level v4.0 - 8 Standards) - Updated Criteria Counts
export const FULL_AUN_CRITERIA = [
  { id: 'AUN 1', name: 'Kết quả học tập mong đợi (ELOs)', items: ['1.1', '1.2', '1.3', '1.4', '1.5'] },
  { id: 'AUN 2', name: 'Cấu trúc và Nội dung Chương trình đào tạo', items: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7'] },
  { id: 'AUN 3', name: 'Phương pháp tiếp cận Dạy và Học', items: ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6'] },
  { id: 'AUN 4', name: 'Đánh giá người học', items: ['4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7'] },
  { id: 'AUN 5', name: 'Đội ngũ Giảng viên', items: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8'] },
  { id: 'AUN 6', name: 'Các dịch vụ hỗ trợ người học', items: ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6'] },
  { id: 'AUN 7', name: 'Cơ sở vật chất và Hạ tầng', items: ['7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9'] },
  { id: 'AUN 8', name: 'Đầu ra và Kết quả', items: ['8.1', '8.2', '8.3', '8.4', '8.5'] },
];

// Full MOET Standards (Circular 01/2024 - 25 Standards) - Vietnamese Labels
export const FULL_MOET_CRITERIA = Array.from({ length: 25 }, (_, i) => ({
  id: `MOET ${i + 1}`,
  name: `Tiêu chuẩn ${i + 1}: Quản lý và Đảm bảo chất lượng`,
  items: ['1', '2', '3', '4', '5'].map(sub => `${i + 1}.${sub}`)
}));

export const INITIAL_EVIDENCE: Evidence[] = [
  {
    id: 'MC-CNTT-01.01',
    fileName: 'Đề cương chi tiết học phần: Kỹ thuật lập trình (v2024)',
    fileType: 'pdf',
    metadata: { 
      issueDate: '2024-01-10', 
      issuingAuthority: 'Bộ môn Công nghệ phần mềm', 
      expirationDate: '2029-01-10',
      isDigitallySigned: true,
      pdcaStages: [PDCAStage.PLAN, PDCAStage.DO],
      fileHash: 'sha256-a1b2c3d4e5'
    },
    version: 1.1,
    uploader: 'TS. Lê Minh Hoàng',
    status: EvidenceStatus.VERIFIED,
    source: 'Upload',
    tags: ['AUN 2.1', 'MOET 1.2'],
    history: [
      { version: 1.1, updatedBy: 'TS. Lê Minh Hoàng', updatedAt: '2024-01-15 08:30', changeNote: 'Cập nhật tài liệu ký số chính thức' },
      { version: 1.0, updatedBy: 'Admin', updatedAt: '2024-01-10 14:20', changeNote: 'Khởi tạo file nháp' }
    ]
  },
  {
    id: 'MC-CNTT-02.04',
    fileName: 'Bảng thống kê kết quả khảo sát tình trạng việc làm SV năm 2023',
    fileType: 'xlsx',
    metadata: { 
      issueDate: '2023-12-20', 
      issuingAuthority: 'Văn phòng Khoa', 
      isDigitallySigned: false,
      pdcaStages: [PDCAStage.CHECK, PDCAStage.ACT],
      fileHash: 'sha256-x8y9z0w1v2'
    },
    version: 1.0,
    uploader: 'ThS. Trần Thị Lan',
    status: EvidenceStatus.VERIFIED,
    source: 'Upload',
    tags: ['AUN 8.3', 'MOET 5.4'],
    history: [
      { version: 1.0, updatedBy: 'ThS. Trần Thị Lan', updatedAt: '2023-12-20 16:45', changeNote: 'Tổng hợp dữ liệu khảo sát đợt 2' }
    ]
  },
  {
    id: 'MC-CNTT-10.15',
    fileName: 'Báo cáo rà soát Chương trình đào tạo Ngành Khoa học máy tính',
    fileType: 'docx',
    metadata: { 
      issueDate: '2024-02-05', 
      issuingAuthority: 'Hội đồng Khoa học Khoa', 
      isDigitallySigned: false,
      pdcaStages: [PDCAStage.PLAN, PDCAStage.CHECK],
    },
    version: 1.2,
    uploader: 'TS. Nguyễn Văn A',
    status: EvidenceStatus.PENDING,
    source: 'Upload',
    tags: ['AUN 2.3', 'MOET 2.1'],
    history: [
      { version: 1.2, updatedBy: 'TS. Nguyễn Văn A', updatedAt: '2024-02-10 11:30', changeNote: 'Hoàn thiện bản thảo lần 2' }
    ]
  },
  {
    id: 'MC-CNTT-05.03',
    fileName: 'Chứng chỉ AWS Certified Cloud Practitioner - Nguyễn Thị Mai',
    fileType: 'pdf',
    metadata: { 
      issueDate: '2021-05-20', 
      issuingAuthority: 'Amazon Web Services',
      expirationDate: '2024-05-20',
      isDigitallySigned: false,
      pdcaStages: [PDCAStage.DO]
    },
    version: 1.0,
    uploader: 'ThS. Nguyễn Thị Mai',
    status: EvidenceStatus.VERIFIED,
    source: 'Upload',
    tags: ['AUN 5.3', 'MOET 4.1'],
    history: [
      { version: 1.0, updatedBy: 'ThS. Nguyễn Thị Mai', updatedAt: '2021-05-25 09:00', changeNote: 'Upload chứng chỉ cá nhân' }
    ]
  },
  {
    id: 'MC-CNTT-08.05',
    fileName: 'Danh sách tổng hợp giờ giảng và NCKH Giảng viên năm học 2022-2023',
    fileType: 'xlsx',
    metadata: { 
      issueDate: '2023-08-30', 
      issuingAuthority: 'Phòng Đảm bảo chất lượng', 
      isDigitallySigned: true,
      pdcaStages: [PDCAStage.CHECK],
      fileHash: 'sha256-k1l2m3n4o5'
    },
    version: 2.0,
    uploader: 'TS. Nguyễn Văn A',
    status: EvidenceStatus.VERIFIED,
    source: 'Upload',
    tags: ['AUN 5.1', 'MOET 4.2'],
    history: [
      { version: 2.0, updatedBy: 'TS. Nguyễn Văn A', updatedAt: '2023-09-05 14:00', changeNote: 'Cập nhật bổ sung giờ nghiên cứu' },
      { version: 1.0, updatedBy: 'Admin', updatedAt: '2023-08-30 09:00', changeNote: 'Dữ liệu sơ bộ' }
    ]
  },
  {
    id: 'MC-CNTT-09.22',
    fileName: 'Quyết định ban hành Quy chế thực tập doanh nghiệp SV CNTT',
    fileType: 'pdf',
    metadata: { 
      issueDate: '2023-11-12', 
      issuingAuthority: 'Ban Giám hiệu Khoa CNTT', 
      isDigitallySigned: true,
      pdcaStages: [PDCAStage.PLAN, PDCAStage.DO],
    },
    version: 1.0,
    uploader: 'TS. Lê Minh Hoàng',
    status: EvidenceStatus.VERIFIED,
    source: 'Upload',
    tags: ['AUN 6.2', 'MOET 8.1'],
    history: [
      { version: 1.0, updatedBy: 'Admin', updatedAt: '2023-11-12 15:00', changeNote: 'Lưu trữ quyết định gốc' }
    ]
  }
];

export const MOCK_KPIS: KPI[] = [
  { id: 'kpi-1', label: 'Tỷ lệ SV/Giảng viên (S/G)', value: 18.5, target: 20, unit: 'SV/GV' },
  { id: 'kpi-2', label: 'Diện tích sàn đào tạo / SV', value: 3.2, target: 2.8, unit: 'm2' },
  { id: 'kpi-3', label: 'Số bài báo Scopus / GV / Năm', value: 1.4, target: 1.0, unit: 'bài' },
  { id: 'kpi-4', label: 'SV có việc làm sau 6 tháng', value: 98.2, target: 95, unit: '%' },
];

export const MOCK_RADAR_DATA = [
  { subject: 'Chuẩn đầu ra', A: 5, fullMark: 7 },
  { subject: 'CT Đào tạo', A: 6, fullMark: 7 },
  { subject: 'Dạy & Học', A: 4, fullMark: 7 },
  { subject: 'Đánh giá SV', A: 5, fullMark: 7 },
  { subject: 'Đội ngũ GV', A: 6, fullMark: 7 },
  { subject: 'Hỗ trợ SV', A: 4, fullMark: 7 },
  { subject: 'Cơ sở vật chất', A: 5, fullMark: 7 },
  { subject: 'Đầu ra', A: 6, fullMark: 7 },
];

export const MOCK_EVIDENCE = [
  { id: 'MC-01', title: 'Quy chế học vụ bậc Đại học 2023', aunCriteriaIds: ['AUN 1.1', 'MOET 1.1'] },
  { id: 'MC-02', title: 'Ma trận kỹ năng SV ngành Kỹ thuật Phần mềm', aunCriteriaIds: ['AUN 2.1'] },
  { id: 'MC-03', title: 'Hợp tác chiến lược với Google Cloud Academy', aunCriteriaIds: ['AUN 7.2', 'MOET 4.2'] },
];

export const AUN_STANDARDS: Standard[] = [
  { 
    id: 'aun-1', 
    code: 'TC 1', 
    name: 'Kết quả học tập mong đợi', 
    type: StandardType.AUN,
    description: 'Xây dựng chuẩn đầu ra dựa trên nhu cầu của các bên liên quan...',
    requiredEvidence: ['Bản mô tả chương trình đào tạo', 'Ma trận chuẩn đầu ra'],
    targetValue: 7,
    currentValue: 5.8,
    unit: 'điểm'
  }
];

export const MOET_STANDARDS: Standard[] = [
  { 
    id: 'moet-1', 
    code: 'TC 1', 
    name: 'Mục tiêu và Chuẩn đầu ra', 
    type: StandardType.MOET,
    description: 'Phù hợp với Thông tư 01/2024 của Bộ Giáo dục...',
    targetValue: 4,
    currentValue: 3,
    unit: 'mức'
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'U-01',
    name: 'TS. Nguyễn Văn A',
    email: 'vana@uni.edu.vn',
    department: 'Ban Thư ký Khoa CNTT',
    roles: [Role.SECRETARIAT, Role.ADMIN],
    status: 'ACTIVE',
    lastLogin: 'Vừa xong'
  }
];