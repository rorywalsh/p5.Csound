const esbuild = require('esbuild');

esbuild
    .build({
        entryPoints: ['src/p5.csound.js'],
        outdir: 'lib',
        bundle: true,
        sourcemap: true,
        minify: true,
        format: 'iife',
        target: ['esnext'],
        globalName: 'Csound'
    })
    .catch(() => process.exit(1));