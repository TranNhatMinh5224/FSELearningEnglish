import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "./apiConfig";

export const essaySubmissionService = {
    // Student methods
    // Submit essay (create new submission)
    submit: (data) => {
        return axiosClient.post(API_ENDPOINTS.ESSAY_SUBMISSIONS.SUBMIT, data);
    },

    // Get submission by ID
    getSubmissionById: (submissionId) => {
        return axiosClient.get(API_ENDPOINTS.ESSAY_SUBMISSIONS.GET_BY_ID(submissionId));
    },

    // Get submission status for an essay
    getSubmissionStatus: (essayId) => {
        return axiosClient.get(API_ENDPOINTS.ESSAY_SUBMISSIONS.GET_SUBMISSION_STATUS(essayId));
    },

    // Update submission
    updateSubmission: (submissionId, data) => {
        return axiosClient.put(API_ENDPOINTS.ESSAY_SUBMISSIONS.UPDATE(submissionId), data);
    },

    // Delete submission
    deleteSubmission: (submissionId) => {
        return axiosClient.delete(API_ENDPOINTS.ESSAY_SUBMISSIONS.DELETE(submissionId));
    },

    // Get my submissions
    getMySubmissions: () => {
        return axiosClient.get(API_ENDPOINTS.ESSAY_SUBMISSIONS.MY_SUBMISSIONS);
    },

    // Teacher methods
    // Get submissions by essay ID with pagination
    getSubmissionsByEssay: (essayId, page = 1, pageSize = 10) => {
        return axiosClient.get(API_ENDPOINTS.TEACHER.GET_ESSAY_SUBMISSIONS_BY_ESSAY(essayId), {
            params: { page, pageSize }
        });
    },

    // Get submission detail
    getSubmissionDetail: (submissionId) => {
        return axiosClient.get(API_ENDPOINTS.TEACHER.GET_ESSAY_SUBMISSION_DETAIL(submissionId));
    },

    // Download submission file
    downloadSubmissionFile: (submissionId) => {
        return axiosClient.get(API_ENDPOINTS.TEACHER.DOWNLOAD_ESSAY_SUBMISSION(submissionId), {
            responseType: 'blob',
            headers: {
                'Accept': '*/*'
            }
        });
    },

    // Grade essay manually (create)
    gradeManually: (submissionId, data) => {
        return axiosClient.post(API_ENDPOINTS.TEACHER.GRADE_ESSAY_MANUALLY(submissionId), data);
    },

    // Update essay grade
    updateGrade: (submissionId, data) => {
        return axiosClient.put(API_ENDPOINTS.TEACHER.UPDATE_ESSAY_GRADE(submissionId), data);
    },

    // Get essay statistics
    getEssayStatistics: (essayId) => {
        return axiosClient.get(API_ENDPOINTS.TEACHER.GET_ESSAY_STATISTICS(essayId));
    },

    // Admin methods
    getAdminSubmissionsByEssay: (essayId, page = 1, pageSize = 10) => {
        return axiosClient.get(API_ENDPOINTS.ADMIN.ESSAY_SUBMISSIONS.GET_BY_ESSAY(essayId), {
            params: { page, pageSize }
        });
    },

    getAdminSubmissionDetail: (submissionId) => {
        return axiosClient.get(API_ENDPOINTS.ADMIN.ESSAY_SUBMISSIONS.GET_BY_ID(submissionId));
    },

    downloadAdminSubmissionFile: (submissionId) => {
        return axiosClient.get(API_ENDPOINTS.ADMIN.ESSAY_SUBMISSIONS.DOWNLOAD(submissionId), {
            responseType: 'blob',
            headers: {
                'Accept': '*/*'
            }
        });
    },

    gradeAdminManually: (submissionId, data) => {
        return axiosClient.post(API_ENDPOINTS.ADMIN.ESSAY_SUBMISSIONS.GRADE(submissionId), data);
    },
};
