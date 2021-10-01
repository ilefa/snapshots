import fs from 'fs';
import RmpIds from '@ilefa/husky/rmpIds.json';
import Classrooms from '@ilefa/husky/classrooms.json';
import CourseMappings from '@ilefa/husky/courses.json';

import { Listr } from 'listr2';
import { TaskWrapper } from 'listr2/dist/lib/task-wrapper';
import { DefaultRenderer } from 'listr2/dist/renderer/default.renderer';

import {
    Classroom,
    CourseAttributes,
    getRawEnrollment,
    getRmpReport,
    ProfessorData,
    RateMyProfessorReport,
    searchCourse,
    SectionData
} from '@ilefa/husky';

interface SnapshotTask {
    courses: CompleteCoursePayload[];
    professors: CompleteProfessorPayload[];
    classrooms: Classroom[];
}

export type Task = TaskWrapper<SnapshotTask, typeof DefaultRenderer>;

export type ProfessorPayload = {
    rmpIds: string[];
    name: string;
}

export type CompleteProfessorPayload = {
    name: string;
    ratings: ProfessorRatings[];
    courses: ProfessorCourse[];
}

export type ProfessorRatings = {
    rmpId: string;
    report: RateMyProfessorReport;
}

export type ProfessorCourse = {
    course: string;
    sections: string[];
}

export type CompleteCoursePayload = {
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
}

export const getSnapshotName = (date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 0 && month <= 4)
        return 'spring' + (year - 1);
    return 'fall' + year;
}

export const snapshot = async () => {
    const start = Date.now();
    const name = getSnapshotName();
    const path = `./snapshots/${name}.json`;
    console.log(`[*] Preparing to capture snapshot for ${name}`);

    const tasks = new Listr<SnapshotTask>([
        {
            title: 'Courses',
            exitOnError: true,
            task: async (ctx, task): Promise<void> => {
                let courseNames = CourseMappings.map(course => course.name.includes(' ') ? course.name.replace(/\s/g, '') : course.name);
                let courses = await Promise.all(courseNames.map(async (name, i, arr) => await getPatchedCourse(name, task, i, arr.length)))
                ctx.courses = courses;
            },
        },
        {
            title: 'Professors',
            exitOnError: false,
            task: async (ctx, task): Promise<void> => {
                let professors = await Promise.all(RmpIds.map(async (ent, i, arr) => await getPatchedProfessor(ent, ctx, task, i, arr.length)))
                ctx.professors = professors;
            }
        },
        {
            title: 'Classrooms',
            exitOnError: false,
            task: async (ctx, _task): Promise<void> => {
                ctx.classrooms = Classrooms as any;
            }
        },
        {
            title: 'Process Data',
            task: async (ctx, _task): Promise<void> => {
                ctx.courses = ctx.courses.sort((a, b) => a.name.localeCompare(b.name));
                ctx.professors = ctx.professors.sort((a, b) => a.name.localeCompare(b.name));
                ctx.classrooms = ctx.classrooms.sort((a, b) => a.name.localeCompare(b.name));
            }
        },
        {
            title: 'Writing snapshot to disk',
            task: async (ctx) => {
                fs.writeFileSync(path, JSON.stringify(ctx, null, 3));
                console.log(`[*] Snapshot for ${name} captured in ${getLatestTimeValue(Date.now() - start)}`)
            }
        }
    ]);

    await tasks.run();
}

/**
 * Attempts to generate a patched course object.
 * 
 * @param name the name of the course
 * @param task the task runner object
 * @param i the index of the course
 * @param all the total number of courses
 */
export const getPatchedCourse = async (name: string, task: Task, i: number, all: number): Promise<CompleteCoursePayload> => {
    let course = await searchCourse(name);
    if (!course) throw new Error(`Error retrieving data for ${name}!`);

    let mappings = CourseMappings.find(mapping => mapping.name === name);
    if (!mappings) throw new Error(`No mappings for ${name}!`);

    task.output = `${name}`

    let patchedSections = await Promise.all(course.sections.map(async section => {
        let enrollment = await getRawEnrollment(section.internal.termCode, section.internal.classNumber, section.internal.classSection);

        return {
            ...section,
            enrollment: {
                max: enrollment.total,
                current: enrollment.available,
                waitlist: section.enrollment.waitlist,
                full: enrollment.overfill,
            }
        }
    }));

    return {
        name: mappings.name,
        catalogName: mappings.catalogName,
        catalogNumber: mappings.catalogNumber,
        attributes: mappings.attributes as CourseAttributes,
        grading: course.grading,
        credits: parseInt(course.credits),
        prerequisites: course.prereqs,
        description: course.description,
        sections: patchedSections,
        professors: course.professors
    }
}

/**
 * Attempts to patch a professor payload.
 * 
 * @param payload the professor rmp payload
 * @param ctx the task runner execution context
 * @param task the task runner object
 * @param i the index of this professor
 * @param all the total amount of professors
 */
export const getPatchedProfessor = async (payload: ProfessorPayload, ctx: SnapshotTask, task: Task, i: number, all: number) => {
    let ratings: ProfessorRatings[] = await Promise.all(payload.rmpIds.map(async rmpId => {
        let report = await getRmpReport(rmpId);
        return {
            rmpId,
            report
        }
    }));

    task.output = `(${i}/${all}) ${payload.name}`;
    let courses = ctx
        .courses
        .filter(course => course
            .professors
            .some(professor => professor.name === payload.name))
            .map(course => ({
                course: course.catalogName,
                sections: course
                    .sections
                    .map(section => section
                        .internal
                        .classSection)
            }))

    return { name: payload.name, ratings, courses }
}

/**
 * Retrieves the formatted duration string
 * for the given millis duration input.
 * 
 * @param time the time in milliseconds
 */
 export const getLatestTimeValue = (time: number) => {
    let sec = Math.trunc(time / 1000) % 60;
    let min = Math.trunc(time / 60000 % 60);
    let hrs = Math.trunc(time / 3600000 % 24);
    let days = Math.trunc(time / 86400000 % 30.4368);
    let mon = Math.trunc(time / 2.6297424E9 % 12.0);
    let yrs = Math.trunc(time / 3.15569088E10);

    let y = `${yrs}y`;
    let mo = `${mon}mo`;
    let d = `${days}d`;
    let h = `${hrs}h`;
    let m = `${min}m`;
    let s = `${sec}s`;

    let result = '';
    if (yrs !== 0) result += `${y}, `;
    if (mon !== 0) result += `${mo}, `;
    if (days !== 0) result += `${d}, `;
    if (hrs !== 0) result += `${h}, `;
    if (min !== 0) result += `${m}, `;
    
    result = result.substring(0, Math.max(0, result.length - 2));
    if ((yrs !== 0 || mon !== 0 || days !== 0 || min !== 0 || hrs !== 0) && sec !== 0) {
        result += ', ' + s;
    }

    if (yrs === 0 && mon === 0 && days === 0 && hrs === 0 && min === 0) {
        result += s;
    }

    return result.trim();
}

snapshot()