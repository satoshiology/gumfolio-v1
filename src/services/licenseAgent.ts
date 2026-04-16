import OpenMolt from 'openmolt';
import { z } from 'zod';
import { gumroadService } from '../services/gumroadService';

const om = new OpenMolt({
  llmProviders: {
    google: { apiKey: process.env.GEMINI_API_KEY }
  }
});

// Define tools for the agent
const licenseTools = [
  {
    handle: 'verifyLicense',
    description: 'Verify a license key',
    execute: async (input: any) => await gumroadService.verifyLicense(input.product_id, input.license_key, false),
    inputSchema: z.object({ product_id: z.string(), license_key: z.string() })
  },
  {
    handle: 'enableLicense',
    description: 'Enable a license key',
    execute: async (input: any) => await gumroadService.enableLicense(input.product_id, input.license_key),
    inputSchema: z.object({ product_id: z.string(), license_key: z.string() })
  },
  {
    handle: 'disableLicense',
    description: 'Disable a license key',
    execute: async (input: any) => await gumroadService.disableLicense(input.product_id, input.license_key),
    inputSchema: z.object({ product_id: z.string(), license_key: z.string() })
  },
  {
    handle: 'decrementLicenseUses',
    description: 'Decrement license uses',
    execute: async (input: any) => await gumroadService.decrementLicenseUses(input.product_id, input.license_key),
    inputSchema: z.object({ product_id: z.string(), license_key: z.string() })
  },
  {
    handle: 'rotateLicense',
    description: 'Rotate a license key',
    execute: async (input: any) => await gumroadService.rotateLicense(input.product_id, input.license_key),
    inputSchema: z.object({ product_id: z.string(), license_key: z.string() })
  }
];

// Register tools as a custom integration
om.registerIntegration('licenseManager', {
  name: 'License Manager',
  tools: licenseTools as any
});

export const licenseAgent = om.createAgent({
  name: 'LicenseCoordinator',
  model: 'google:gemini-2.0-flash',
  instructions: 'You are a license management coordinator. Use the provided tools to perform license actions.',
  integrations: [
    { integration: 'licenseManager', credential: { type: 'custom', config: {} }, scopes: 'all' }
  ]
});
