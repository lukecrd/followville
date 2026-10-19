/** @type {import('next').NextConfig} */
export default {
  poweredByHeader:false,
  serverExternalPackages:['@libsql/client'],
  experimental:{cpus:2},
};
