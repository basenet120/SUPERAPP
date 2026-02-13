import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  authAPI, 
  equipmentAPI, 
  bookingAPI, 
  contactsAPI, 
  companiesAPI, 
  dealsAPI, 
  chatAPI,
  activityAPI 
} from '../services/api';
import { toast } from 'sonner';

// Auth Hooks
export const useAuthUser = () => {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const response = await authAPI.me();
      return response.data.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, password }) => authAPI.login(email, password),
    onSuccess: (response) => {
      const { accessToken, refreshToken, user } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      queryClient.setQueryData(['auth', 'user'], user);
      toast.success('Welcome back!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Login failed');
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
      toast.success('Logged out successfully');
    },
  });
};

// Dashboard Hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await bookingAPI.getDashboardStats();
      return response.data.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: ['activity', 'recent', limit],
    queryFn: async () => {
      const response = await activityAPI.getRecent({ limit });
      return response.data.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
  });
};

// Equipment Hooks
export const useEquipment = (params = {}) => {
  return useQuery({
    queryKey: ['equipment', params],
    queryFn: async () => {
      const response = await equipmentAPI.list(params);
      return response.data.data;
    },
  });
};

export const useEquipmentById = (id) => {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: async () => {
      const response = await equipmentAPI.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useEquipmentCategories = () => {
  return useQuery({
    queryKey: ['equipment', 'categories'],
    queryFn: async () => {
      const response = await equipmentAPI.getCategories();
      return response.data.data;
    },
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => equipmentAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to add equipment');
    },
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => equipmentAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
      toast.success('Equipment updated successfully');
    },
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => equipmentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment deleted successfully');
    },
  });
};

export const useCheckEquipmentAvailability = (id, startDate, endDate) => {
  return useQuery({
    queryKey: ['equipment', id, 'availability', startDate, endDate],
    queryFn: async () => {
      const response = await equipmentAPI.checkAvailability(id, startDate, endDate);
      return response.data.data;
    },
    enabled: !!id && !!startDate && !!endDate,
  });
};

// Booking Hooks
export const useBookings = (params = {}) => {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const response = await bookingAPI.list(params);
      return response.data.data;
    },
  });
};

export const useBookingById = (id) => {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: async () => {
      const response = await bookingAPI.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => bookingAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      toast.success('Booking created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create booking');
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => bookingAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.id] });
      toast.success('Booking updated successfully');
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, reason }) => bookingAPI.updateStatus(id, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.id] });
      toast.success(`Booking status updated to ${variables.status}`);
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => bookingAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      toast.success('Booking deleted successfully');
    },
  });
};

export const useCalculatePricing = () => {
  return useMutation({
    mutationFn: (data) => bookingAPI.calculatePricing(data),
  });
};

// Contact Hooks
export const useContacts = (params = {}) => {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const response = await contactsAPI.list(params);
      return response.data.data;
    },
  });
};

export const useContactById = (id) => {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const response = await contactsAPI.getById(id);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => contactsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      toast.success('Contact created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create contact');
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => contactsAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.id] });
      toast.success('Contact updated successfully');
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => contactsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted successfully');
    },
  });
};

// Company Hooks
export const useCompanies = (params = {}) => {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      const response = await companiesAPI.list(params);
      return response.data.data;
    },
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => companiesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created successfully');
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => companiesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated successfully');
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => companiesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted successfully');
    },
  });
};

// Deals/Pipeline Hooks
export const useDeals = (params = {}) => {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: async () => {
      const response = await dealsAPI.list(params);
      return response.data.data;
    },
  });
};

export const usePipeline = () => {
  return useQuery({
    queryKey: ['deals', 'pipeline'],
    queryFn: async () => {
      const response = await dealsAPI.getPipeline();
      return response.data.data;
    },
  });
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => dealsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', 'pipeline'] });
      toast.success('Deal created successfully');
    },
  });
};

export const useUpdateDealStage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, stage }) => dealsAPI.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals', 'pipeline'] });
    },
  });
};

// Chat Hooks
export const useChatChannels = () => {
  return useQuery({
    queryKey: ['chat', 'channels'],
    queryFn: async () => {
      const response = await chatAPI.getChannels();
      return response.data.data;
    },
  });
};

export const useChatMessages = (channelId) => {
  return useQuery({
    queryKey: ['chat', 'messages', channelId],
    queryFn: async () => {
      const response = await chatAPI.getMessages(channelId);
      return response.data.data;
    },
    enabled: !!channelId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ channelId, data }) => chatAPI.sendMessage(channelId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['chat', 'messages', variables.channelId] 
      });
    },
  });
};

// File Upload Hooks
export const useUploadCOI = () => {
  return useMutation({
    mutationFn: ({ bookingId, file }) => bookingAPI.uploadCOI(bookingId, file),
    onSuccess: () => {
      toast.success('COI uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload COI');
    },
  });
};

export const useSignContract = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookingId, signature }) => bookingAPI.signContract(bookingId, signature),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.bookingId] });
      toast.success('Contract signed successfully');
    },
  });
};
