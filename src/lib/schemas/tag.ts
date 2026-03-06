import type { TemplateSchema } from '@/types';

export const tagSchema: TemplateSchema = {
  id: 'tag',
  name: 'Tags',
  description: 'Tags for categorising and grouping data across KubeNest.',
  group: 'Tags',
  icon: 'Tags',
  columns: [
    {
      name: 'Name',
      aliases: ['tag', 'tag name', 'label', 'category', 'tag value'],
      type: 'text',
      required: true,
      description: 'Tag name',
      validation: { maxLength: 200, minLength: 1 },
    },
  ],
  uniqueConstraint: ['Name'],
};
