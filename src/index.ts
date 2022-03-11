import fs from 'fs';
import RmpIds from '@ilefa/husky/rmpIds.json';
import Classrooms from '@ilefa/husky/classrooms.json';
import CourseMappings from '@ilefa/husky/courses.json';

import {
    Classroom,
    CourseAttributes,
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
    if (month >= 0 && month <= 5)
        return 'spring' + year;
    return 'fall' + year;
}

export const snapshot = async () => {
    const start = Date.now();
    const name = getSnapshotName();
    const path = `./records/${name}.json`;

    let ctx: SnapshotTask = {} as any;
    console.log(`[*] Preparing to capture snapshot for ${name}`);

    let courseNames = (CourseMappings as any)
        .map(course => course.name.includes(' ')
            ? course.name.replace(/\s/g, '')
            : course.name)
        .sort((a, b) => a.localeCompare(b));

    console.log(`[*] Capturing ${courseNames.length} courses..`);
    let courses = [];
    let courseI = 0;

    for (let name of courseNames) {
        courseI++;

        let start = Date.now();
        let course = await getPatchedCourse(name);
        if (course.name.includes('(Missing)')) console.log(`!!!!!! Missing data for ${name} !!!!!!`);
        else console.log(`--> [${courseI}/${courseNames.length}] ${name} took ${(Date.now() - start).toFixed(2)}ms`);

        courses.push(course);
    }

    ctx.courses = courses;
    fs.writeFileSync(`./records/${name}-courses.json`, JSON.stringify(courses, null, 3));
    
    console.log(`[*] Capturing ${RmpIds.length} professor IDs..`);
    let professors = [];
    let professorsI = 0;
    for (let id of RmpIds) {
        professorsI++;

        let start = Date.now();
        let prof = await getPatchedProfessor(id, ctx);
        console.log(`--> [${professorsI}/${RmpIds.length}] ${prof.name} took ${(Date.now() - start).toFixed(2)}ms`);
        
        professors.push(prof);
    }

    ctx.professors = professors;
    fs.writeFileSync(`./records/${name}-profs.json`, JSON.stringify(professors, null, 3));
    
    console.log(`[*] Capturing classrooms..`);
    ctx.classrooms = Classrooms as any;
    fs.writeFileSync(`./records/${name}-classrooms.json`, JSON.stringify(ctx.classrooms, null, 3));
    
    console.log(`[*] Processing data..`);
    ctx.courses = ctx.courses.sort((a, b) => a.name.localeCompare(b.name));
    ctx.professors = ctx.professors.sort((a, b) => a.name.localeCompare(b.name));
    ctx.classrooms = ctx.classrooms.sort((a, b) => a.name.localeCompare(b.name));

    fs.writeFileSync(path, JSON.stringify(ctx, null, 3));
    console.log(`[*] Snapshot for ${name} captured in ${getLatestTimeValue(Date.now() - start)}`)
}

/**
 * Attempts to generate a patched course object.
 * 
 * @param name the name of the course
 * @param task the task runner object
 * @param i the index of the course
 * @param all the total number of courses
 */
export const getPatchedCourse = async (name: string): Promise<CompleteCoursePayload> => {
    let course = await searchCourse(name);
    if (!course) return {
        name: `${name} (Missing)`,
        catalogName: null,
        catalogNumber: null,
        attributes: {
            writing: null,
            lab: null,
            contentAreas: null,
            environmental: null,
            quantitative: null
        },
        grading: null,
        credits: null,
        prerequisites: null,
        description: null,
        sections: [],
        professors: [],
    };

    let mappings = (CourseMappings as any).find(mapping => mapping.name === name);
    if (!mappings) return {
        name: `${name} (Missing)`,
        catalogName: null,
        catalogNumber: null,
        attributes: {
            writing: null,
            lab: null,
            contentAreas: null,
            environmental: null,
            quantitative: null
        },
        grading: course.grading,
        credits: parseInt(course.credits),
        prerequisites: course.prereqs,
        description: course.description,
        sections: course.sections,
        professors: course.professors,
    };

    // let patchedSections = await Promise.all(course.sections.map(async section => {
    //     let enrollment = await getRawEnrollment(section.internal.termCode, section.internal.classNumber, section.internal.classSection);

    //     return {
    //         ...section,
    //         enrollment: {
    //             max: enrollment.total,
    //             current: enrollment.available,
    //             waitlist: section.enrollment.waitlist,
    //             full: enrollment.overfill,
    //         }
    //     }
    // }));

    return {
        name: mappings.name,
        catalogName: mappings.catalogName,
        catalogNumber: mappings.catalogNumber,
        attributes: mappings.attributes as CourseAttributes,
        grading: course.grading,
        credits: parseInt(course.credits),
        prerequisites: course.prereqs,
        description: course.description,
        sections: course.sections,
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
export const getPatchedProfessor = async (payload: ProfessorPayload, ctx: SnapshotTask) => {
    let ratings: ProfessorRatings[] = await Promise.all(payload.rmpIds.map(async rmpId => {
        let report = await getRmpReport(rmpId);
        return {
            rmpId,
            report
        }
    }));

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