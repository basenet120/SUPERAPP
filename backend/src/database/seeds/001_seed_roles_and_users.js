const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Clear existing data
  await knex('user_permissions').del();
  await knex('role_permissions').del();
  await knex('user_roles').del();
  await knex('permissions').del();
  await knex('roles').del();
  await knex('users').del();

  // Create roles
  const roles = await knex('roles').insert([
    { name: 'Administrator', slug: 'admin', description: 'Full system access', level: 100 },
    { name: 'Employee', slug: 'employee', description: 'Internal team member', level: 50 },
    { name: 'Manager', slug: 'manager', description: 'Team manager with elevated permissions', level: 75 },
    { name: 'Member', slug: 'member', description: 'Registered member with limited access', level: 25 },
    { name: 'Client', slug: 'client', description: 'External client access', level: 10 }
  ]).returning('*');

  // Create permissions
  const permissions = await knex('permissions').insert([
    // User management
    { name: 'View Users', slug: 'users.view', resource: 'users', action: 'view' },
    { name: 'Create Users', slug: 'users.create', resource: 'users', action: 'create' },
    { name: 'Edit Users', slug: 'users.edit', resource: 'users', action: 'edit' },
    { name: 'Delete Users', slug: 'users.delete', resource: 'users', action: 'delete' },
    
    // Equipment management
    { name: 'View Equipment', slug: 'equipment.view', resource: 'equipment', action: 'view' },
    { name: 'Create Equipment', slug: 'equipment.create', resource: 'equipment', action: 'create' },
    { name: 'Edit Equipment', slug: 'equipment.edit', resource: 'equipment', action: 'edit' },
    { name: 'Delete Equipment', slug: 'equipment.delete', resource: 'equipment', action: 'delete' },
    
    // Booking management
    { name: 'View Bookings', slug: 'bookings.view', resource: 'bookings', action: 'view' },
    { name: 'Create Bookings', slug: 'bookings.create', resource: 'bookings', action: 'create' },
    { name: 'Edit Bookings', slug: 'bookings.edit', resource: 'bookings', action: 'edit' },
    { name: 'Delete Bookings', slug: 'bookings.delete', resource: 'bookings', action: 'delete' },
    { name: 'Approve Bookings', slug: 'bookings.approve', resource: 'bookings', action: 'approve' },
    
    // Client management
    { name: 'View Clients', slug: 'clients.view', resource: 'clients', action: 'view' },
    { name: 'Create Clients', slug: 'clients.create', resource: 'clients', action: 'create' },
    { name: 'Edit Clients', slug: 'clients.edit', resource: 'clients', action: 'edit' },
    
    // Financial
    { name: 'View Financials', slug: 'financials.view', resource: 'financials', action: 'view' },
    { name: 'Manage Payments', slug: 'payments.manage', resource: 'payments', action: 'manage' },
    
    // System
    { name: 'System Settings', slug: 'system.settings', resource: 'system', action: 'settings' },
    { name: 'View Audit Log', slug: 'audit.view', resource: 'audit', action: 'view' },
    
    // Chat
    { name: 'Chat Access', slug: 'chat.access', resource: 'chat', action: 'access' },
    { name: 'Chat Admin', slug: 'chat.admin', resource: 'chat', action: 'admin' }
  ]).returning('*');

  // Map role/permission IDs
  const adminRole = roles.find(r => r.slug === 'admin');
  const managerRole = roles.find(r => r.slug === 'manager');
  const employeeRole = roles.find(r => r.slug === 'employee');
  const clientRole = roles.find(r => r.slug === 'client');

  // Assign all permissions to admin
  const adminPermissions = permissions.map(p => ({
    role_id: adminRole.id,
    permission_id: p.id
  }));
  await knex('role_permissions').insert(adminPermissions);

  // Assign relevant permissions to manager
  const managerPermissionSlugs = [
    'users.view', 'equipment.view', 'equipment.create', 'equipment.edit',
    'bookings.view', 'bookings.create', 'bookings.edit', 'bookings.approve',
    'clients.view', 'clients.create', 'clients.edit',
    'financials.view', 'payments.manage', 'chat.access', 'chat.admin'
  ];
  const managerPermissions = permissions
    .filter(p => managerPermissionSlugs.includes(p.slug))
    .map(p => ({ role_id: managerRole.id, permission_id: p.id }));
  await knex('role_permissions').insert(managerPermissions);

  // Assign relevant permissions to employee
  const employeePermissionSlugs = [
    'equipment.view', 'bookings.view', 'bookings.create', 'bookings.edit',
    'clients.view', 'chat.access'
  ];
  const employeePermissions = permissions
    .filter(p => employeePermissionSlugs.includes(p.slug))
    .map(p => ({ role_id: employeeRole.id, permission_id: p.id }));
  await knex('role_permissions').insert(employeePermissions);

  // Assign minimal permissions to client
  const clientPermissions = permissions
    .filter(p => p.slug === 'bookings.view' || p.slug === 'bookings.create')
    .map(p => ({ role_id: clientRole.id, permission_id: p.id }));
  await knex('role_permissions').insert(clientPermissions);

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = await knex('users').insert({
    email: 'admin@basecreative.com',
    password_hash: hashedPassword,
    first_name: 'System',
    last_name: 'Administrator',
    phone: '+1-555-0100',
    status: 'active',
    email_verified: true,
    email_verified_at: knex.fn.now()
  }).returning('*');

  // Assign admin role
  await knex('user_roles').insert({
    user_id: adminUser[0].id,
    role_id: adminRole.id
  });

  // Create test employee
  const employeePassword = await bcrypt.hash('Employee123!', 12);
  const employeeUser = await knex('users').insert({
    email: 'employee@basecreative.com',
    password_hash: employeePassword,
    first_name: 'Test',
    last_name: 'Employee',
    phone: '+1-555-0101',
    status: 'active',
    email_verified: true,
    email_verified_at: knex.fn.now()
  }).returning('*');

  await knex('user_roles').insert({
    user_id: employeeUser[0].id,
    role_id: employeeRole.id
  });

  // Create test client user
  const clientPassword = await bcrypt.hash('Client123!', 12);
  const clientUser = await knex('users').insert({
    email: 'client@example.com',
    password_hash: clientPassword,
    first_name: 'Test',
    last_name: 'Client',
    phone: '+1-555-0102',
    status: 'active',
    email_verified: true,
    email_verified_at: knex.fn.now()
  }).returning('*');

  await knex('user_roles').insert({
    user_id: clientUser[0].id,
    role_id: clientRole.id
  });

  console.log('Seed completed: Users, roles, and permissions created');
};
