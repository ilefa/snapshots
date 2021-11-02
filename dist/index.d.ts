import { Classroom, CourseAttributes, ProfessorData, RateMyProfessorReport, SectionData } from '@ilefa/husky';
interface SnapshotTask {
    courses: CompleteCoursePayload[];
    professors: CompleteProfessorPayload[];
    classrooms: Classroom[];
}
export declare type ProfessorPayload = {
    rmpIds: string[];
    name: string;
};
export declare type CompleteProfessorPayload = {
    name: string;
    ratings: ProfessorRatings[];
    courses: ProfessorCourse[];
};
export declare type ProfessorRatings = {
    rmpId: string;
    report: RateMyProfessorReport;
};
export declare type ProfessorCourse = {
    course: string;
    sections: string[];
};
export declare type CompleteCoursePayload = {
    name: string;
    catalogName: string;
    catalogNumber: string;
    attributes: CourseAttributes;
    grading: string;
    credits: number;
    prerequisites: string;
    description: string;
    sections: SectionData[];
    professors: ProfessorData[];
};
export declare const getSnapshotName: (date?: Date) => string;
export declare const snapshot: () => Promise<void>;
/**
 * Attempts to generate a patched course object.
 *
 * @param name the name of the course
 * @param task the task runner object
 * @param i the index of the course
 * @param all the total number of courses
 */
export declare const getPatchedCourse: (name: string) => Promise<CompleteCoursePayload>;
/**
 * Attempts to patch a professor payload.
 *
 * @param payload the professor rmp payload
 * @param ctx the task runner execution context
 * @param task the task runner object
 * @param i the index of this professor
 * @param all the total amount of professors
 */
export declare const getPatchedProfessor: (payload: ProfessorPayload, ctx: SnapshotTask) => Promise<{
    name: string;
    ratings: ProfessorRatings[];
    courses: {
        course: string;
        sections: string[];
    }[];
}>;
/**
 * Retrieves the formatted duration string
 * for the given millis duration input.
 *
 * @param time the time in milliseconds
 */
export declare const getLatestTimeValue: (time: number) => string;
export {};
