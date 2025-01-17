// import react from '@vitejs/plugin-react';
// import { defineConfig } from 'vite';

// export default defineConfig({
// 	plugins: [react()],
// 	build: {
// 		lib: {
// 			entry: 'src/index.ts',
// 			name: 'ReactAuthFaceId',
// 			fileName: format => `react-auth-faceid.${format}.js`,
// 		},
// 	},
// 	server: {
// 		port: 5174,
// 	},
// 	publicDir: 'public', // <-- убедись, что это значение используется
// });

import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	root: path.resolve(__dirname, './example'), // Указываем папку example как корень проекта
	publicDir: path.resolve(__dirname, './public'), // Указываем путь к public вручную
	plugins: [react()],
	build: {
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			name: 'ReactAuthFaceId',
			fileName: format => `react-auth-faceid.${format}.js`,
		},
		rollupOptions: {
			external: ['react', 'react-dom'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
				},
			},
		},
	},
	server: {
		port: 5174,
	},
});
