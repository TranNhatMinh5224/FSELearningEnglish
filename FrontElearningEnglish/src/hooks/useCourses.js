import { useQuery } from "@tanstack/react-query";
import { courseService } from "../Services/courseService";
import { useAssets } from "../Context/AssetContext";

/**
 * Hook to fetch all system courses with automatic caching.
 */
export const useSystemCourses = () => {
    const { getDefaultCourseImage } = useAssets();

    return useQuery({
        queryKey: ["system-courses"],
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
        // Cache configuration is handled by default in App.js, but can be overridden here if needed.
    });
};

/**
 * Hook to fetch a specific course by ID.
 */
export const useCourseById = (courseId) => {
    return useQuery({
        queryKey: ["course", courseId],
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
