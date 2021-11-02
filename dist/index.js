"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestTimeValue = exports.getPatchedProfessor = exports.getPatchedCourse = exports.snapshot = exports.getSnapshotName = void 0;
var fs_1 = __importDefault(require("fs"));
var rmpIds_json_1 = __importDefault(require("@ilefa/husky/rmpIds.json"));
var classrooms_json_1 = __importDefault(require("@ilefa/husky/classrooms.json"));
var courses_json_1 = __importDefault(require("@ilefa/husky/courses.json"));
var husky_1 = require("@ilefa/husky");
var getSnapshotName = function (date) {
    if (date === void 0) { date = new Date(); }
    var year = date.getFullYear();
    var month = date.getMonth();
    if (month >= 0 && month <= 4)
        return 'spring' + (year - 1);
    return 'fall' + year;
};
exports.getSnapshotName = getSnapshotName;
var snapshot = function () { return __awaiter(void 0, void 0, void 0, function () {
    var start, name, path, ctx, courseNames, courses, courseI, _i, courseNames_1, name_1, start_1, course, professors, professorsI, _a, RmpIds_1, id, start_2, prof;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                start = Date.now();
                name = (0, exports.getSnapshotName)();
                path = "./snapshots/" + name + ".json";
                ctx = {};
                console.log("[*] Preparing to capture snapshot for " + name);
                courseNames = courses_json_1.default
                    .map(function (course) { return course.name.includes(' ')
                    ? course.name.replace(/\s/g, '')
                    : course.name; })
                    .sort(function (a, b) { return a.localeCompare(b); });
                console.log("[*] Capturing " + courseNames.length + " courses..");
                courses = [];
                courseI = 0;
                _i = 0, courseNames_1 = courseNames;
                _b.label = 1;
            case 1:
                if (!(_i < courseNames_1.length)) return [3 /*break*/, 4];
                name_1 = courseNames_1[_i];
                courseI++;
                start_1 = Date.now();
                return [4 /*yield*/, (0, exports.getPatchedCourse)(name_1)];
            case 2:
                course = _b.sent();
                if (course.name.includes('(Missing)'))
                    console.log("!!!!!! Missing data for " + name_1 + " !!!!!!");
                else
                    console.log("--> [" + courseI + "/" + courseNames.length + "] " + name_1 + " took " + (Date.now() - start_1).toFixed(2) + "ms");
                courses.push(course);
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                ctx.courses = courses;
                fs_1.default.writeFileSync("./snapshots/" + name + "-courses.json", JSON.stringify(courses, null, 3));
                console.log("[*] Capturing " + rmpIds_json_1.default.length + " professor IDs..");
                professors = [];
                professorsI = 0;
                _a = 0, RmpIds_1 = rmpIds_json_1.default;
                _b.label = 5;
            case 5:
                if (!(_a < RmpIds_1.length)) return [3 /*break*/, 8];
                id = RmpIds_1[_a];
                professorsI++;
                start_2 = Date.now();
                return [4 /*yield*/, (0, exports.getPatchedProfessor)(id, ctx)];
            case 6:
                prof = _b.sent();
                console.log("--> [" + professorsI + "/" + rmpIds_json_1.default.length + "] " + prof.name + " took " + (Date.now() - start_2).toFixed(2) + "ms");
                professors.push(prof);
                _b.label = 7;
            case 7:
                _a++;
                return [3 /*break*/, 5];
            case 8:
                ctx.professors = professors;
                fs_1.default.writeFileSync("./snapshots/" + name + "-profs.json", JSON.stringify(professors, null, 3));
                console.log("[*] Capturing classrooms..");
                ctx.classrooms = classrooms_json_1.default;
                fs_1.default.writeFileSync("./snapshots/" + name + "-classrooms.json", JSON.stringify(ctx.classrooms, null, 3));
                console.log("[*] Processing data..");
                ctx.courses = ctx.courses.sort(function (a, b) { return a.name.localeCompare(b.name); });
                ctx.professors = ctx.professors.sort(function (a, b) { return a.name.localeCompare(b.name); });
                ctx.classrooms = ctx.classrooms.sort(function (a, b) { return a.name.localeCompare(b.name); });
                fs_1.default.writeFileSync(path, JSON.stringify(ctx, null, 3));
                console.log("[*] Snapshot for " + name + " captured in " + (0, exports.getLatestTimeValue)(Date.now() - start));
                return [2 /*return*/];
        }
    });
}); };
exports.snapshot = snapshot;
/**
 * Attempts to generate a patched course object.
 *
 * @param name the name of the course
 * @param task the task runner object
 * @param i the index of the course
 * @param all the total number of courses
 */
var getPatchedCourse = function (name) { return __awaiter(void 0, void 0, void 0, function () {
    var course, mappings;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, husky_1.searchCourse)(name)];
            case 1:
                course = _a.sent();
                if (!course)
                    return [2 /*return*/, {
                            name: name + " (Missing)",
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
                        }];
                mappings = courses_json_1.default.find(function (mapping) { return mapping.name === name; });
                if (!mappings)
                    return [2 /*return*/, {
                            name: name + " (Missing)",
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
                        }];
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
                return [2 /*return*/, {
                        name: mappings.name,
                        catalogName: mappings.catalogName,
                        catalogNumber: mappings.catalogNumber,
                        attributes: mappings.attributes,
                        grading: course.grading,
                        credits: parseInt(course.credits),
                        prerequisites: course.prereqs,
                        description: course.description,
                        sections: course.sections,
                        professors: course.professors
                    }];
        }
    });
}); };
exports.getPatchedCourse = getPatchedCourse;
/**
 * Attempts to patch a professor payload.
 *
 * @param payload the professor rmp payload
 * @param ctx the task runner execution context
 * @param task the task runner object
 * @param i the index of this professor
 * @param all the total amount of professors
 */
var getPatchedProfessor = function (payload, ctx) { return __awaiter(void 0, void 0, void 0, function () {
    var ratings, courses;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(payload.rmpIds.map(function (rmpId) { return __awaiter(void 0, void 0, void 0, function () {
                    var report;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, (0, husky_1.getRmpReport)(rmpId)];
                            case 1:
                                report = _a.sent();
                                return [2 /*return*/, {
                                        rmpId: rmpId,
                                        report: report
                                    }];
                        }
                    });
                }); }))];
            case 1:
                ratings = _a.sent();
                courses = ctx
                    .courses
                    .filter(function (course) { return course
                    .professors
                    .some(function (professor) { return professor.name === payload.name; }); })
                    .map(function (course) { return ({
                    course: course.catalogName,
                    sections: course
                        .sections
                        .map(function (section) { return section
                        .internal
                        .classSection; })
                }); });
                return [2 /*return*/, { name: payload.name, ratings: ratings, courses: courses }];
        }
    });
}); };
exports.getPatchedProfessor = getPatchedProfessor;
/**
 * Retrieves the formatted duration string
 * for the given millis duration input.
 *
 * @param time the time in milliseconds
 */
var getLatestTimeValue = function (time) {
    var sec = Math.trunc(time / 1000) % 60;
    var min = Math.trunc(time / 60000 % 60);
    var hrs = Math.trunc(time / 3600000 % 24);
    var days = Math.trunc(time / 86400000 % 30.4368);
    var mon = Math.trunc(time / 2.6297424E9 % 12.0);
    var yrs = Math.trunc(time / 3.15569088E10);
    var y = yrs + "y";
    var mo = mon + "mo";
    var d = days + "d";
    var h = hrs + "h";
    var m = min + "m";
    var s = sec + "s";
    var result = '';
    if (yrs !== 0)
        result += y + ", ";
    if (mon !== 0)
        result += mo + ", ";
    if (days !== 0)
        result += d + ", ";
    if (hrs !== 0)
        result += h + ", ";
    if (min !== 0)
        result += m + ", ";
    result = result.substring(0, Math.max(0, result.length - 2));
    if ((yrs !== 0 || mon !== 0 || days !== 0 || min !== 0 || hrs !== 0) && sec !== 0) {
        result += ', ' + s;
    }
    if (yrs === 0 && mon === 0 && days === 0 && hrs === 0 && min === 0) {
        result += s;
    }
    return result.trim();
};
exports.getLatestTimeValue = getLatestTimeValue;
(0, exports.snapshot)();
//# sourceMappingURL=index.js.map