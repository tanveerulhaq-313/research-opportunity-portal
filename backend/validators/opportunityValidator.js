// backend/validators/opportunityValidator.js

const VALID_STATUSES = ['Open', 'Closed'];

/**
 * Validate the body of a create/update request.
 * @param {object} body - req.body
 * @param {boolean} isUpdate - if true, only validate provided fields
 * @returns {{ valid: boolean, errors: string[], data: object }}
 */
function validateOpportunity(body, isUpdate = false) {
  const errors = [];
  const data = {};

  // Helper: ensure field exists & is a non-empty string
  const checkString = (field, label, maxLen) => {
    if (body[field] === undefined) {
      if (!isUpdate) errors.push(`${label} is required`);
      return;
    }
    if (typeof body[field] !== 'string' || body[field].trim() === '') {
      errors.push(`${label} must be a non-empty string`);
      return;
    }
    if (maxLen && body[field].length > maxLen) {
      errors.push(`${label} must be at most ${maxLen} characters`);
      return;
    }
    data[field] = body[field].trim();
  };

  checkString('title',        'Title',        255);
  checkString('description',  'Description');
  checkString('area',         'Area',         100);
  checkString('faculty_name', 'Faculty name', 100);
  checkString('department',   'Department',   100);
  checkString('skills',       'Skills',       255);

  // positions: required positive integer
  if (body.positions === undefined) {
    if (!isUpdate) errors.push('Positions is required');
  } else {
    const n = Number(body.positions);
    if (!Number.isInteger(n) || n < 1) {
      errors.push('Positions must be a positive integer');
    } else {
      data.positions = n;
    }
  }

  // deadline: required valid date (YYYY-MM-DD)
  if (body.deadline === undefined) {
    if (!isUpdate) errors.push('Deadline is required');
  } else {
    const d = new Date(body.deadline);
    if (isNaN(d.getTime())) {
      errors.push('Deadline must be a valid date (YYYY-MM-DD)');
    } else {
      data.deadline = body.deadline;
    }
  }

  // status: optional, must be Open or Closed
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    } else {
      data.status = body.status;
    }
  }

  // For create: everything required. For update: at least one field.
  if (isUpdate && Object.keys(data).length === 0) {
    errors.push('At least one field must be provided for update');
  }

  return { valid: errors.length === 0, errors, data };
}

module.exports = { validateOpportunity, VALID_STATUSES };