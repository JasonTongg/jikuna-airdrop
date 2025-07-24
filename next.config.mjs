/** @type {import('next').NextConfig} */
const nextConfig = {
	// Enable polling for file watching (fixes HMR in WSL2/Windows Bash)
	// Optional: Uncomment if you want to use custom headers
	// async headers() {
	//   return [
	//     {
	//       source: "/(.*)",
	//       headers: [
	//         {
	//           key: "Content-Security-Policy",
	//           value:
	//             "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';",
	//         },
	//       ],
	//     },
	//   ];
	// },
};

export default nextConfig;
