import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Attendance', 'Overtime', 'Leave', 'Users', 'ManualPunch'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
    }),

    // Attendance
    punchIn: builder.mutation({
      query: (data) => ({
        url: '/attendance/punch-in',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    punchOut: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/attendance/punch-out/${id}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    getMyAttendance: builder.query({
      query: (page = 1) => `/attendance/my-history?page=${page}`,
      providesTags: ['Attendance'],
    }),

    // Overtime
    submitOvertime: builder.mutation({
      query: (data) => ({
        url: '/overtime',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Overtime'],
    }),
    getMyOvertimeRequests: builder.query({
      query: () => '/overtime/my-requests',
      providesTags: ['Overtime'],
    }),
    getPendingOvertime: builder.query({
      query: () => '/overtime/pending',
      providesTags: ['Overtime'],
    }),
    updateOvertimeStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/overtime/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Overtime'],
    }),

    // Leaves
    submitLeave: builder.mutation({
      query: (data) => ({
        url: '/leave',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Leave'],
    }),
    getMyLeaves: builder.query({
      query: () => '/leave/my-requests',
      providesTags: ['Leave'],
    }),
    getPendingLeaves: builder.query({
      query: () => '/leave/pending',
      providesTags: ['Leave'],
    }),
    updateLeaveStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leave/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Leave'],
    }),

    // Manual Punch
    submitManualPunch: builder.mutation({
      query: (data) => ({
        url: '/manual-punch',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ManualPunch'],
    }),
    getMyManualPunches: builder.query({
      query: () => '/manual-punch/my-requests',
      providesTags: ['ManualPunch'],
    }),
    getPendingManualPunches: builder.query({
      query: () => '/manual-punch/pending',
      providesTags: ['ManualPunch'],
    }),
    updateManualPunchStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/manual-punch/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['ManualPunch', 'Attendance'],
    }),

    // Admin & Users
    getAllUsers: builder.query({
      query: (page = 1) => `/admin/users?page=${page}`,
      providesTags: ['Users'],
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: '/admin/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    getDailyReport: builder.query({
      query: (date) => `/admin/reports/daily${date ? `?date=${date}` : ''}`,
      providesTags: ['Attendance'],
    }),
    validateAttendance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/attendance/${id}/validate`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetMyAttendanceQuery,
  useSubmitOvertimeMutation,
  useGetMyOvertimeRequestsQuery,
  useGetPendingOvertimeQuery,
  useUpdateOvertimeStatusMutation,
  useSubmitLeaveMutation,
  useGetMyLeavesQuery,
  useGetPendingLeavesQuery,
  useUpdateLeaveStatusMutation,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useGetDailyReportQuery,
  useValidateAttendanceMutation,
  useSubmitManualPunchMutation,
  useGetMyManualPunchesQuery,
  useGetPendingManualPunchesQuery,
  useUpdateManualPunchStatusMutation,
} = apiSlice;
