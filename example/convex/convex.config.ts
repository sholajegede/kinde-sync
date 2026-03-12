import { defineApp } from "convex/server";
import kindeSync from "../../src/component/convex.config.js";

const app = defineApp();
app.use(kindeSync);

export default app;