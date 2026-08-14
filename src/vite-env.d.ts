/// <reference types="vite/client" />

// Ambient types for Vite's asset imports (`import img from "./x.png"`) and for
// import.meta.env. The project had none, so any asset import failed typecheck
// even though the bundler resolved it fine.
