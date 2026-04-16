import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { jobsAPI, applicantsAPI, screeningAPI } from "@/lib/api";

interface JobsState {
  jobs: any[];
  currentJob: any | null;
  applicants: any[];
  screeningResults: any | null;
  loading: boolean;
  screeningLoading: boolean;
  error: string | null;
}

const initialState: JobsState = {
  jobs: [],
  currentJob: null,
  applicants: [],
  screeningResults: null,
  loading: false,
  screeningLoading: false,
  error: null,
};

export const fetchJobs = createAsyncThunk("jobs/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await jobsAPI.getAll();
    return res.data.jobs;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || "Failed to fetch jobs");
  }
});

export const fetchJob = createAsyncThunk("jobs/fetchOne", async (id: string, { rejectWithValue }) => {
  try {
    const res = await jobsAPI.getById(id);
    return res.data.job;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || "Failed to fetch job");
  }
});

export const createJob = createAsyncThunk("jobs/create", async (data: any, { rejectWithValue }) => {
  try {
    const res = await jobsAPI.create(data);
    return res.data.job;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || "Failed to create job");
  }
});

export const fetchApplicants = createAsyncThunk("jobs/fetchApplicants", async (jobId: string, { rejectWithValue }) => {
  try {
    const res = await applicantsAPI.getAll(jobId);
    return res.data.applicants;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || "Failed to fetch applicants");
  }
});

export const uploadApplicantFile = createAsyncThunk(
  "jobs/uploadApplicants",
  async ({ jobId, file }: { jobId: string; file: File }, { rejectWithValue }) => {
    try {
      const res = await applicantsAPI.upload(jobId, file);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Upload failed");
    }
  }
);

export const addApplicantsJSON = createAsyncThunk(
  "jobs/addApplicants",
  async ({ jobId, applicants }: { jobId: string; applicants: any[] }, { rejectWithValue }) => {
    try {
      const res = await applicantsAPI.add(jobId, applicants);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Failed to add applicants");
    }
  }
);

export const triggerScreening = createAsyncThunk(
  "jobs/screen",
  async ({ jobId, shortlistSize }: { jobId: string; shortlistSize: number }, { rejectWithValue }) => {
    try {
      const res = await screeningAPI.trigger(jobId, shortlistSize);
      return res.data.result;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Screening failed");
    }
  }
);

export const fetchScreeningResults = createAsyncThunk(
  "jobs/fetchResults",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const res = await screeningAPI.getResults(jobId);
      return res.data.results;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Failed to fetch results");
    }
  }
);

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    clearCurrentJob: (state) => { state.currentJob = null; state.applicants = []; state.screeningResults = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    // Fetch all jobs
    builder.addCase(fetchJobs.pending, (state) => { state.loading = true; });
    builder.addCase(fetchJobs.fulfilled, (state, action) => { state.loading = false; state.jobs = action.payload; });
    builder.addCase(fetchJobs.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });

    // Fetch single job
    builder.addCase(fetchJob.fulfilled, (state, action) => { state.currentJob = action.payload; });

    // Create job
    builder.addCase(createJob.pending, (state) => { state.loading = true; });
    builder.addCase(createJob.fulfilled, (state, action) => { state.loading = false; state.jobs.unshift(action.payload); });
    builder.addCase(createJob.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });

    // Fetch applicants
    builder.addCase(fetchApplicants.fulfilled, (state, action) => { state.applicants = action.payload; });

    // Upload applicants
    builder.addCase(uploadApplicantFile.pending, (state) => { state.loading = true; });
    builder.addCase(uploadApplicantFile.fulfilled, (state) => { state.loading = false; });
    builder.addCase(uploadApplicantFile.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });

    // Screening
    builder.addCase(triggerScreening.pending, (state) => { state.screeningLoading = true; });
    builder.addCase(triggerScreening.fulfilled, (state, action) => { state.screeningLoading = false; state.screeningResults = action.payload; });
    builder.addCase(triggerScreening.rejected, (state, action) => { state.screeningLoading = false; state.error = action.payload as string; });

    // Fetch results
    builder.addCase(fetchScreeningResults.fulfilled, (state, action) => { state.screeningResults = action.payload; });
  },
});

export const { clearCurrentJob, clearError } = jobsSlice.actions;
export default jobsSlice.reducer;
