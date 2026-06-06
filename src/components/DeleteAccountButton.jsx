import React, { useState } from 'react';

export default function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);

  const deleteAccount = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    // This will delete the current user via Clerk
    try {
      await window.Clerk?.user?.delete();
      alert("Account deleted. You can now create a new one.");
      window.location.href = '/#landing';
    } catch (err) {
      alert("Error deleting account. Please do it from Clerk Dashboard.");
    }
  };

  return (
    <button
      onClick={deleteAccount}
      className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
    >
      {confirming ? "⚠️ Confirm Delete Account" : "️ Delete My Account"}
    </button>
  );
}
