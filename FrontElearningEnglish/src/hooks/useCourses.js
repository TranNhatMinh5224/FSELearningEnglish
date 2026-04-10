import { useQuery } from "@tanstack/react-query";
import { courseService } from "../Services/courseService";
import { useAssets } from "../Context/AssetContext";
import { useAuth } from "../Context/AuthContext";

/**
 * Hook to fetch all system courses with automatic caching.
 */
export const useSystemCourses = () => {
    const { getDefaultCourseImage } = useAssets();
    const { isAuthenticated, user } = useAuth();
    const userKey = isAuthenticated ? (user?.userId ?? user?.id ?? "auth") : "anon";

    return useQuery({
        queryKey: ["system-courses", userKey],
        queryFn: async () => {
            const response = await courseService.getSystemCourses();
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Không thể tải danh sách khóa học");
            }
            
            // Map the data once here so components don't have to
            return response.data.data.map(course => ({
                ...course,
                id: course.courseId,
                imageUrl: course.imageUrl && course.imageUrl.trim() !== "" 
                    ? course.imageUrl 
                    : getDefaultCourseImage(),
                // price and isEnrolled are handled differently in different views, 
                // but we keep the raw values from API here.
            }));
        },
        // Force fresh data (avoid stale enrollment state on Home)
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });
};

/**
 * Hook to fetch a specific course by ID.
 */
export const useCourseById = (courseId) => {
    const { isAuthenticated, user } = useAuth();
    const userKey = isAuthenticated ? (user?.userId ?? user?.id ?? "auth") : "anon";

    return useQuery({
        queryKey: ["course", courseId, userKey],
        queryFn: async () => {
            if (!courseId) return null;
            const response = await courseService.getCourseById(courseId);
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Không thể tải thông tin khóa học");
            }
            return response.data.data;
        },
        enabled: !!courseId,
    });
};
