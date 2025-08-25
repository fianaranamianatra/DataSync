import { create } from 'zustand';
import { DashboardStore, DataRecord, FilterState } from '../types/dashboard';

// Données d'exemple
const sampleData: DataRecord[] = [
  {
    id: "545293830",
    uuid: "874c5dbf-bbb9-4f5d-b4ae-547f709914c1",
    submitted_by: "mathieumi",
    submission_time: "2025-01-15T07:46:50",
    location: {
      lat: -18.919671,
      lng: 47.523901,
      address: "Antaniavo, Antohomadinika"
    },
    modules: {
      m11: { a: "dkdkd", b: "lldldd", c: "ldldld" },
      m12: "mdmd",
      m13: 1,
      m14: 87,
      m15: 7,
      m16: "Completed",
      m17: 95
    },
    duration: 47,
    device: "web"
  },
  {
    id: "545293831",
    uuid: "874c5dbf-bbb9-4f5d-b4ae-547f709914c2",
    submitted_by: "enqueteur_08",
    submission_time: "2025-01-15T09:30:20",
    location: {
      lat: -18.925671,
      lng: 47.530901,
      address: "Ambohimanga, Antananarivo"
    },
    modules: {
      m11: { a: "test", b: "data", c: "sample" },
      m12: "active",
      m13: 2,
      m14: 92,
      m15: 8,
      m16: "In Progress",
      m17: 78
    },
    duration: 32,
    device: "mobile"
  },
  {
    id: "545293832",
    uuid: "874c5dbf-bbb9-4f5d-b4ae-547f709914c3",
    submitted_by: "admin_user",
    submission_time: "2025-01-14T14:15:30",
    location: {
      lat: -18.915671,
      lng: 47.520901,
      address: "Analakely, Antananarivo"
    },
    modules: {
      m11: { a: "admin", b: "control", c: "panel" },
      m12: "system",
      m13: 3,
      m14: 98,
      m15: 9,
      m16: "Completed",
      m17: 100
    },
    duration: 25,
    device: "web"
  }
];

export const useDashboardStore = create<DashboardStore>((set) => ({
  data: sampleData,
  filters: {
    dateRange: { start: null, end: null },
    modules: [],
    users: [],
    devices: []
  },
  theme: 'light',
  sidebarCollapsed: false,
  loading: false,
  
  setData: (data) => set({ data }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
  toggleSidebar: () => set((state) => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  })),
  setLoading: (loading) => set({ loading })
}));