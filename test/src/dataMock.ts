export const dictionaryBase = {
    paths: {
        description: '',
        isPublic: false,
        isQueryable: true,
        isRestricted: true,
    },
    permissions: {
        description: '',
        isPublic: false,
        isQueryable: true,
        isRestricted: false,
    },
    roles: {
        description: '',
        isPublic: false,
        isQueryable: true,
        isRestricted: false,
    },
    authorizations: {
        description: '',
        isPublic: false,
        isQueryable: false,
        isRestricted: true,
    },
    posts: {
        description: '',
        isPublic: true,
        isQueryable: true,
        isRestricted: false,
    },
    employes: {
        description: '',
        isPublic: true,
        isQueryable: true,
        isRestricted: false,
    },
    clients: {
        description: '',
        isPublic: true,
        isQueryable: true,
        isRestricted: false,
    },
    shippings: {
        description: '',
        isPublic: true,
        isQueryable: true,
        isRestricted: false,
    },
};

export const permissionsBase = {
    allAccess: {
        description: 'Permiso de escritura y lectura toltal a todas los recursos no restringidos',
        name: 'Acceso total',
        resources: {
            clients: {
                read: true,
                write: true,
            },
            employes: {
                read: true,
                write: true,
            },
            paths: {
                read: true,
                write: true,
            },
            permissions: {
                read: true,
                write: true,
            },
            posts: {
                read: true,
                write: true,
            },
            roles: {
                read: true,
                write: true,
            },
        },
        roles: {
            admin: {
                description: '',
                name: 'Administrador',
            },
        },
    },
    readOnly: {
        name: 'Solo lectura',
        description: '',
        roles: {
            guest: {
                name: 'invitado',
                description: '',
            },
            guest2: {
                name: 'Invitado superior',
                description: '',
            },
        },
        resources: {
            paths: {
                write: false,
                read: true,
            },
            permissions: {
                write: false,
                read: true,
            },
            roles: {
                write: false,
                read: true,
            },
            posts: {
                write: false,
                read: true,
            },
            employes: {
                write: false,
                read: true,
            },
            clients: {
                write: false,
                read: true,
            },
        },
    },
    readOnlyPublic: {
        name: 'Solo lectura',
        description: 'Solo lectura de recursos públicos',
        roles: {
            guest2: {
                name: 'Invitado superior',
                description: '',
            },
        },
        resources: {
            posts: {
                write: false,
                read: true,
            },
            employes: {
                write: false,
                read: true,
            },
            clients: {
                write: false,
                read: true,
            },
        },
    },
    onlyWriteShippings: {
        name: 'Solo escritura en shipping',
        description: 'solo podrá editar crear y eliminar en envios',
        roles: {
            guest2: {
                name: 'Invitado superior',
                description: '',
            },
        },
        resources: {
            shippings: {
                write: true,
                read: false,
            },
        },
    },
    createAndUpdateOnlyPublic: {
        name: 'crear y actualizar publico',
        description: 'Solo crea y actualiza contenidos publicos',
        roles: {
            guest2: {
                name: 'Invitado superior',
                description: '',
            },
        },
        resources: {
            posts: {
                write: 'UC',
                read: true,
            },
            employes: {
                write: 'UC',
                read: true,
            },
            clients: {
                write: 'UC',
                read: true,
            },
        },
    },
};

export const rolesBase: any = {
    admin: {
        name: 'Administrador',
        description: '',
        permissions: {
            allAccess: true,
        },
    },
    guest: {
        name: 'Invitado',
        description: '',
        permissions: {
            readOnly: true,
        },
    },
    guest2: {
        name: 'Invitado superior',
        description: '',
        permissions: {
            readOnly: true,
            readOnlyPublic: true,
            onlyWriteShippings: true,
        },
    },
};