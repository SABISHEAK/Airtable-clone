// helper functions to validate field data
// this checks if the data matches the field type requirements

const checkFieldData = (field, value) => {
  // check if required field is empty
  if (field.required && (value === null || value === undefined || value === '')) {
    return `${field.name} is required and cannot be empty`;
  }

  // if field is empty but not required, that's okay
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // now check based on field type
  switch (field.type) {
    case 'email':
      // simple email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return `${field.name} needs to be a valid email address`;
      }
      break;
      
    case 'url':
      // check if it's a valid URL
      try {
        new URL(value);
      } catch {
        return `${field.name} needs to be a valid URL (like https://example.com)`;
      }
      break;
      
    case 'phone':
      // basic phone number validation
      const phonePattern = /^[\+]?[\d\s\-\(\)]{10,}$/;
      if (!phonePattern.test(value)) {
        return `${field.name} needs to be a valid phone number`;
      }
      break;
      
    case 'number':
    case 'currency':
      // check if it's actually a number
      if (isNaN(value)) {
        return `${field.name} must be a valid number`;
      }
      break;
      
    case 'date':
    case 'datetime':
      // check if it's a valid date
      if (!Date.parse(value)) {
        return `${field.name} must be a valid date`;
      }
      break;
      
    case 'dropdown':
      // value must be one of the allowed options
      if (!field.options.includes(value)) {
        return `${field.name} must be one of these options: ${field.options.join(', ')}`;
      }
      break;
      
    case 'multiselect':
      // value should be an array and all items should be valid options
      if (!Array.isArray(value) || !value.every(item => field.options.includes(item))) {
        return `${field.name} can only contain these options: ${field.options.join(', ')}`;
      }
      break;
      
    case 'checkbox':
      // must be true or false
      if (typeof value !== 'boolean') {
        return `${field.name} must be either true or false`;
      }
      break;
  }
  
  // if we get here, validation passed
  return null;
};

module.exports = { checkFieldData };