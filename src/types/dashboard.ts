export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface ModuleData {
  [key: string]: string | number | object;
}

export interface DataRecord {
  id: string;
  uuid: string;
  submitted_by: string;
  submission_time: string;
  location: Location;
  modules: ModuleData;
  duration: number;
  device: 'web' | 'mobile' | 'tablet';
}

export interface KPIMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
  [key: string]: any;
}

export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  modules: string[];
  users: string[];
  devices: string[];
}

export interface DashboardStore {
  data: DataRecord[];
  filters: FilterState;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  loading: boolean;
  setData: (data: DataRecord[]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
}