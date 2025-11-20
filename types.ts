export interface Client {
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  imageUrl: string;
  floorPlanUrl?: string;
  coverImageUrl?: string;
}

export type StatVariant = 'success' | 'critical' | 'warning';

export interface Stat {
  icon: string;
  label: string;
  value: string | number;
  variant: StatVariant;
}

export interface NavItem {
  icon: string;
  label: string;
}

export interface Inspection {
    date: string;
    time: string;
}

export type EquipmentStatus = 'ok' | 'fail' | 'maintenance';

export interface Equipment {
  id: string;
  location: string;
  lastInspected: string;
  status: EquipmentStatus;
}

export interface EquipmentCategory {
  name: string;
  icon: string;
  items: Equipment[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ChecklistEquipment {
  id: string;
  name: string;
  building: string;
  floor: string;
  room: string;
  lastInspected: string;
  lastInspector: string;
  lastStatus: 'OK' | 'Falha' | 'Pendente';
}

export interface UserProfile {
    name: string;
    technicianId: string;
    company: string;
    avatarUrl: string;
}

export interface SettingsItemType {
    id: string;
    type: 'link' | 'toggle';
    icon: string;
    label: string;
    href?: string;
}

export interface SettingsSectionType {
    title: string;
    items: SettingsItemType[];
}

export interface NewEquipment {
  id: string;
  location: string;
  category: string;
}

export interface InspectionRecord {
  id: string;
  inspectionDate: string;
  equipmentId: string;
  status: 'OK' | 'Falha' | 'Pendente';
  checklistItems: ChecklistItem[];
  evidencePhoto: string | null;
  observations: string;
  generalObservations: string;
  technicianId: string;
}

// FIX: Added ReportClient interface. It was previously an inline type in AppData.
export interface ReportClient {
  name: string;
  address: string;
  inspectionDate: string;
  reportId: string;
  imageUrl: string;
}

// FIX: Added ReportItemStatus type for report components.
export type ReportItemStatus = 'Passou' | 'Falhou' | 'Reparo Necessário';

// FIX: Added ReportItem interface for report components.
export interface ReportItem {
  title: string;
  status: ReportItemStatus;
  description: string;
}

export interface AppData {
    client: Client;
    stats: Stat[];
    inspection: Inspection;
    equipmentData: EquipmentCategory[];
    checklistEquipment: ChecklistEquipment;
    checklistData: ChecklistItem[];
    // reportClient is no longer used by a primary screen, but kept for pdf generation logic
    reportClient: ReportClient;
    userProfile: UserProfile;
    settings: SettingsSectionType[];
    inspectionHistory: InspectionRecord[];
}

export interface ScannedEquipment {
    categoryName: string;
    categoryIcon: string;
    item: Equipment;
}
