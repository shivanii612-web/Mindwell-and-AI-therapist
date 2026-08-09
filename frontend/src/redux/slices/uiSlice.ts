import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  activeModal: string | null;
  isLoading: boolean;
  globalError: string | null;
  toastMessage: { type: 'success' | 'error' | 'info'; message: string } | null;
}

const initialState: UIState = {
  isDarkMode: localStorage.getItem('darkMode') === 'true',
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  activeModal: null,
  isLoading: false,
  globalError: null,
  toastMessage: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      localStorage.setItem('darkMode', String(state.isDarkMode));
      if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      localStorage.setItem('darkMode', String(action.payload));
      if (action.payload) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
    },
    showToast: (
      state,
      action: PayloadAction<{ type: 'success' | 'error' | 'info'; message: string }>
    ) => {
      state.toastMessage = action.payload;
    },
    clearToast: (state) => {
      state.toastMessage = null;
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  openModal,
  closeModal,
  setGlobalLoading,
  setGlobalError,
  showToast,
  clearToast,
} = uiSlice.actions;

export default uiSlice.reducer;
