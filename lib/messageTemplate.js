// Message Template Helper
// Handles template parsing with variable substitution

export function parseTemplate(template, variables) {
  let message = template;
  for (const key in variables) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    message = message.replace(regex, variables[key] || '');
  }
  return message;
}

// Get template by name from database
export async function getTemplateByName(supabase, templateName) {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('name', templateName)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching template:', error);
    return null;
  }

  return data;
}

// Render template with client data
export function renderTemplate(template, client) {
  const variables = {
    name: client.name || '',
    plan_name: client.plan_name || '',
    plan_expiry: client.plan_expiry || '',
    plan_start: client.plan_start || '',
    email: client.email || '',
    phone: client.phone || ''
  };

  return parseTemplate(template.content, variables);
}