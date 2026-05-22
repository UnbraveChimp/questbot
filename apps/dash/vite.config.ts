import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "./app"),
        },
    },
    plugins: [
        {
            enforce: 'pre',
            ...mdx({
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
            }),
        },
        reactRouter(),
        tailwindcss(),
    ],
    ssr: {
        external: ["@questbot/database"],
    },
});
