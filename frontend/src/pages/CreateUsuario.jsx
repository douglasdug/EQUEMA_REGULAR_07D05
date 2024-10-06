import React, { useState } from "react";

// Datos iniciales
const initialRoles = ["admin", "editor", "user"];
const initialUsers = [
  { id: 1, name: "Alice", role: "admin" },
  { id: 2, name: "Bob", role: "editor" },
  { id: 3, name: "Charlie", role: "user" },
];

const CreateUsuario = () => {
  const [roles, setRoles] = useState(initialRoles);
  const [users, setUsers] = useState(initialUsers);
  const [newRole, setNewRole] = useState("");

  // Manejar cambios en el rol del usuario
  const handleRoleChange = (userId, newRole) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  // Manejar cambios en el nuevo rol
  const handleNewRoleChange = (event) => {
    setNewRole(event.target.value);
  };

  // Agregar un nuevo rol
  const handleAddRole = () => {
    if (newRole && !roles.includes(newRole)) {
      setRoles([...roles, newRole]);
      setNewRole("");
    }
  };

  return (
    <div>
      <h1>Administración de Roles</h1>

      <div>
        <h2>Agregar Nuevo Rol</h2>
        <input
          type="text"
          value={newRole}
          onChange={handleNewRoleChange}
          placeholder="Nuevo rol"
        />
        <button onClick={handleAddRole}>Agregar Rol</button>
      </div>

      <div>
        <h2>Usuarios</h2>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name} - {user.role}
              <select
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                value={user.role}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CreateUsuario;
