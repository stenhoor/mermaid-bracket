import esbuild from 'esbuild';
import { builtinModules } from 'node:module';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const prod = process.argv[2] === 'production';
const here = path.dirname(new URL(import.meta.url).pathname);
const vaultPluginDir = path.resolve(here, '../../test-vault/.obsidian/plugins/mermaid-bracket');

/** Copy the built plugin into the repo's test vault after every build. */
const installToVault = {
  name: 'install-to-vault',
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length) return;
      await mkdir(vaultPluginDir, { recursive: true });
      for (const f of ['main.js', 'manifest.json', 'styles.css']) {
        await copyFile(path.join(here, f), path.join(vaultPluginDir, f));
      }
      console.log(`installed to ${vaultPluginDir}`);
    });
  },
};

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian', 'electron', ...builtinModules],
  format: 'cjs',
  target: 'es2021',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: prod,
  plugins: [installToVault],
});

if (prod) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
