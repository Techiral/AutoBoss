
// This file is intentionally left blank.
// It's a convention for declaring modules that don't have their own type definitions.
// For example, if you were to use a library without @types, you could add:
// declare module 'some-library-without-types';
// In this project, it's used to satisfy TypeScript's module resolution for packages like 'wav'.
declare module 'wav';
