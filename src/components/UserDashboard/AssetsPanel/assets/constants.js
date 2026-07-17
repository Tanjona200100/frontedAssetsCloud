// src/components/UserDashboard/assets/constants.js

// ============ LISTE DES FORMATS 3D ============
export const SUPPORTED_3D_FORMATS = [
  'glb', 'gltf', 'fbx', 'obj', 'stl', 'dae', '3ds',
  'blend', 'ply', '3mf', 'amf', 'bvh', 'c4d', 'dxf',
  'iges', 'igs', 'jtl', 'jt', 'lwo', 'lws', 'lxo',
  'modo', 'ms3d', 'ndo', 'nff', 'off', 'pov', 'prc',
  'sldasm', 'sldprt', 'step', 'stp', 'usd', 'usda', 'usdc',
  'usdz', 'vrml', 'wrl', 'x3d', 'x3db', 'x3dv',
  'x_t', 'x_b', 'sat', 'sab', 'asm', 'neu', 'cgr'
];

export const VIEWABLE_3D_FORMATS = ['glb', 'gltf', 'fbx', 'obj', 'stl', 'ply', '3mf'];

export const ITEMS_PER_PAGE = 12;

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL;