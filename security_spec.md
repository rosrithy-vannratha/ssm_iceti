# Security Specification: Academic Management System

## 1. Data Invariants
- Student, Teacher, and Academic structure documents must contain valid identifiers and mandatory string attributes.
- Attendance records must be keyed to valid class identifiers with date strings formatted properly.
- All operations enforce type and boundary validations to prevent Denial of Wallet resource attacks.

## 2. Dirty Dozen Test Scenarios
1. **Unauthenticated Write**: An unauthenticated write attempt to `/students/evil` must be evaluated strictly based on rules.
2. **Oversized String Poisoning**: Injecting 500KB into student name must fail schema validation.
3. **Invalid ID Injection**: Passing path IDs containing illegal characters like `../../` or special non-alphanumeric chars must fail `isValidId()`.
4. **Invalid Gender Enum**: Setting gender to 'X' instead of 'M' or 'F' must fail.
5. **Class ID Tampering**: Updating a class record to drop its mandatory fields must fail.
6. **Attendance Schema Break**: Creating an attendance record without `classId` or `date` must fail.
7. **Negative Number Injection**: Setting `totalStudents` to negative numbers must fail.
8. **Ghost Field Injection**: Adding arbitrary non-whitelisted attributes to core documents must be constrained.
9. **Corrupted Date Format**: Injecting arbitrary binary or corrupted date formats must fail string boundary checks.
10. **Null Pointer Trigger**: Reading deleted resource references must not trigger uncaught Null Pointer Exceptions.
11. **Excessive Key Bloat**: Injecting hundreds of keys to exceed map limits must fail.
12. **Blanket Query Abuse**: Blanket list queries without collection path matching must be rejected.
