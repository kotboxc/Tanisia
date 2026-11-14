document.addEventListener('DOMContentLoaded', function () {
  const storageKey = 'tanisia-profile';
  const editButton = document.querySelector('#profile-edit');
  const editDialog = document.querySelector('#profile-edit-dialog');
  const editForm = document.querySelector('#profile-edit-form');
  const editCancelButton = document.querySelector('#profile-edit-cancel');
  const editStatus = document.querySelector('#profile-edit-status');
  const logoutButton = document.querySelector('#profile-logout');
  const logoutDialog = document.querySelector('#profile-logout-dialog');
  const logoutCancelButton = document.querySelector('#profile-logout-cancel');
  const storageStatus = document.querySelector('#profile-storage-status');
  const profileFields = {
    name: document.querySelector('[data-profile-field="name"]'),
    email: document.querySelector('[data-profile-field="email"]'),
    phone: document.querySelector('[data-profile-field="phone"]')
  };
  const formFields = {
    name: editForm.elements.namedItem('name'),
    email: editForm.elements.namedItem('email'),
    phone: editForm.elements.namedItem('phone')
  };

  function showStorageError(message) {
    storageStatus.textContent = message;
    storageStatus.hidden = false;
  }

  function getSavedProfile() {
    try {
      const savedProfile = localStorage.getItem(storageKey);
      if (savedProfile === null) {
        return null;
      }

      const profile = JSON.parse(savedProfile);
      const hasValidFields = profile
        && typeof profile === 'object'
        && ['name', 'email', 'phone'].every(function (field) {
          return typeof profile[field] === 'string' && profile[field].trim() !== '';
        });

      if (!hasValidFields) {
        throw new Error('Збережені дані профілю мають некоректний формат.');
      }

      return profile;
    } catch (error) {
      console.error('Не вдалося завантажити дані профілю:', error);
      showStorageError('Не вдалося прочитати збережені дані. Перевірте налаштування сховища браузера.');
      return null;
    }
  }

  function renderProfile(profile) {
    Object.keys(profileFields).forEach(function (field) {
      profileFields[field].textContent = profile[field];
      formFields[field].value = profile[field];
    });
  }

  function openEditDialog() {
    editStatus.textContent = '';
    const savedProfile = getSavedProfile();
    if (savedProfile) {
      renderProfile(savedProfile);
    } else {
      Object.keys(profileFields).forEach(function (field) {
        formFields[field].value = profileFields[field].textContent;
      });
    }
    editDialog.showModal();
  }

  editButton.addEventListener('click', openEditDialog);
  editCancelButton.addEventListener('click', function () {
    editDialog.close();
  });
  logoutButton.addEventListener('click', function () {
    logoutDialog.showModal();
  });
  logoutCancelButton.addEventListener('click', function () {
    logoutDialog.close();
  });

  editForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const profile = {
      name: formFields.name.value.trim(),
      email: formFields.email.value.trim(),
      phone: formFields.phone.value.trim()
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
      renderProfile(profile);
      storageStatus.hidden = true;
      storageStatus.textContent = '';
      editDialog.close();
    } catch (error) {
      console.error('Не вдалося зберегти дані профілю:', error);
      editStatus.textContent = 'Не вдалося зберегти зміни. Перевірте налаштування сховища браузера.';
    }
  });

  const savedProfile = getSavedProfile();
  if (savedProfile) {
    renderProfile(savedProfile);
  }
});
