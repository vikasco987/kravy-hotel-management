"use client";
import React, { useState, useEffect } from 'react';
import { Hotel, X, ChevronDown, Users, Snowflake, Wifi, Tv, Bath, Mountain, Check, UserRound, Plus, Loader2, Settings2, Edit2, Trash2 } from 'lucide-react';

export type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'INSPECTED' | 'MAINTENANCE' | 'BLOCKED';

export interface Floor {
  id: string;
  name: string;
}

export interface RoomTypeItem {
  id: string;
  name: string;
  basePrice: number; // in paise from API
}

export interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  floors: Floor[];
  onSuccess: () => void;
  editingRoomId?: string | null;
  editingRoomHasGuest?: boolean;
  initialData?: any;
}

export function AddRoomModal({
  isOpen,
  onClose,
  floors,
  onSuccess,
  editingRoomId,
  editingRoomHasGuest,
  initialData,
}: AddRoomModalProps) {
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomFloorId, setNewRoomFloorId] = useState("");
  const [newRoomType, setNewRoomType] = useState("Standard");
  const [newRoomCapacity, setNewRoomCapacity] = useState(2);
  const [newRoomPrice, setNewRoomPrice] = useState(1500);
  const [newRoomStatus, setNewRoomStatus] = useState<RoomStatus>("AVAILABLE");
  const [newRoomStaff, setNewRoomStaff] = useState("");
  const [newRoomAmenities, setNewRoomAmenities] = useState<string[]>([]);
  const [newRoomNotes, setNewRoomNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Category State
  const [roomCategories, setRoomCategories] = useState<RoomTypeItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryBasePrice, setCustomCategoryBasePrice] = useState<number>(2000);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Category Manage / Edit / Delete Modal State
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RoomTypeItem | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryPrice, setEditCategoryPrice] = useState<number>(2000);
  const [isSavingCategoryEdit, setIsSavingCategoryEdit] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<RoomTypeItem | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [manageCategoryError, setManageCategoryError] = useState<string | null>(null);

  const fetchRoomCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await fetch('/api/hotel/room-types');
      if (res.ok) {
        const types: RoomTypeItem[] = await res.json();
        setRoomCategories(types);
      }
    } catch (e) {
      console.error('Failed to load room categories:', e);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (isOpen) {
      fetch('/api/hotel/room-types')
        .then(res => res.ok ? res.json() : [])
        .then(types => {
          if (!ignore && Array.isArray(types)) {
            setRoomCategories(types);
          }
        })
        .catch(err => console.error('Failed to load room categories:', err));
    }
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const resetRoomForm = () => {
    setNewRoomNumber("");
    setNewRoomFloorId(floors?.[0]?.id || "");
    setNewRoomType("Standard");
    setNewRoomCapacity(2);
    setNewRoomPrice(1500);
    setNewRoomStatus("AVAILABLE");
    setNewRoomStaff("");
    setNewRoomAmenities([]);
    setNewRoomNotes("");
    setShowAddCategoryForm(false);
    setCustomCategoryName("");
    setCategoryError(null);
  };

  useEffect(() => {
    if (isOpen) {
      if (editingRoomId && initialData) {
        setNewRoomNumber(initialData.roomNumber || initialData.number || "");
        setNewRoomFloorId(initialData.floorId || initialData.floor?.id || floors?.[0]?.id || "");
        setNewRoomType(initialData.roomType || initialData.type || "Standard");
        setNewRoomCapacity(initialData.capacity || 2);
        const parsedPrice = typeof initialData.basePrice === 'number'
          ? initialData.basePrice
          : typeof initialData.price === 'number'
            ? Math.round(initialData.price / 100)
            : 1500;
        setNewRoomPrice(parsedPrice);
        setNewRoomStatus((initialData.status as RoomStatus) || "AVAILABLE");
        setNewRoomStaff(initialData.staff || "");
        setNewRoomAmenities(initialData.amenities || []);
        setNewRoomNotes(initialData.notes || initialData.description || "");
      } else {
        resetRoomForm();
      }
    }
  }, [isOpen, editingRoomId, initialData, floors]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = customCategoryName.trim();
    if (!trimmedName) {
      setCategoryError("Category name is required");
      return;
    }

    if (customCategoryBasePrice <= 0 || isNaN(customCategoryBasePrice)) {
      setCategoryError("Base price must be greater than ₹0");
      return;
    }

    // Check duplicate locally (case-insensitive)
    const duplicate = roomCategories.some(
      c => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    ) || ['standard', 'deluxe', 'suite'].includes(trimmedName.toLowerCase());

    if (duplicate) {
      setCategoryError("A category with this name already exists");
      return;
    }

    setIsCreatingCategory(true);
    setCategoryError(null);

    try {
      // API expects basePrice in minor units (paise) as an integer
      const payloadBasePrice = Math.round(customCategoryBasePrice * 100);
      const res = await fetch('/api/hotel/room-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          basePrice: payloadBasePrice
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setCategoryError(errData.error || "Failed to create category");
        return;
      }

      const created: RoomTypeItem = await res.json();

      // Update categories list
      setRoomCategories(prev => [...prev.filter(c => c.id !== created.id), created]);

      // Automatically select the new category and update price
      setNewRoomType(created.name);
      setNewRoomPrice(Math.round(created.basePrice / 100));

      // Reset inline form
      setCustomCategoryName("");
      setShowAddCategoryForm(false);
    } catch (err) {
      console.error('Error creating category:', err);
      setCategoryError("Network error while creating category");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSelectRoomType = (typeName: string) => {
    setNewRoomType(typeName);

    // If matching category found, update default room price if user hasn't explicitly customized for an edit
    const matched = roomCategories.find(c => c.name.toLowerCase() === typeName.toLowerCase());
    if (matched && typeof matched.basePrice === 'number' && matched.basePrice > 0) {
      setNewRoomPrice(Math.round(matched.basePrice / 100));
    } else if (typeName === 'Standard') {
      setNewRoomPrice(1500);
    } else if (typeName === 'Deluxe') {
      setNewRoomPrice(2500);
    } else if (typeName === 'Suite') {
      setNewRoomPrice(5000);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setNewRoomAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  // Compile combined distinct categories list
  const allCategoryNames = React.useMemo(() => {
    const list: string[] = ['Standard', 'Deluxe', 'Suite'];
    roomCategories.forEach(c => {
      if (!list.some(existing => existing.toLowerCase() === c.name.toLowerCase())) {
        list.push(c.name);
      }
    });
    if (newRoomType && !list.some(existing => existing.toLowerCase() === newRoomType.toLowerCase())) {
      list.push(newRoomType);
    }
    return list;
  }, [roomCategories, newRoomType]);

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const trimmedName = editCategoryName.trim();
    if (!trimmedName) {
      setManageCategoryError("Category name cannot be blank");
      return;
    }

    if (editCategoryPrice <= 0 || isNaN(editCategoryPrice)) {
      setManageCategoryError("Base price must be greater than ₹0");
      return;
    }

    // Check duplicate name against other categories (case-insensitive)
    const duplicate = roomCategories.some(
      c => c.id !== editingCategory.id && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setManageCategoryError("Another category with this name already exists");
      return;
    }

    setIsSavingCategoryEdit(true);
    setManageCategoryError(null);

    try {
      const payloadBasePrice = Math.round(editCategoryPrice * 100);
      const res = await fetch(`/api/hotel/room-types/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          basePrice: payloadBasePrice
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setManageCategoryError(errData.error || "Failed to update category");
        return;
      }

      const updated: RoomTypeItem = await res.json();

      // Update room categories state
      setRoomCategories(prev => prev.map(c => c.id === updated.id ? updated : c));

      // If the current room form has this category selected, update its display name and price
      if (newRoomType.toLowerCase() === editingCategory.name.toLowerCase()) {
        setNewRoomType(updated.name);
        setNewRoomPrice(Math.round(updated.basePrice / 100));
      }

      setEditingCategory(null);
    } catch (err) {
      console.error('Error updating category:', err);
      setManageCategoryError("Network error while updating category");
    } finally {
      setIsSavingCategoryEdit(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    setManageCategoryError(null);

    try {
      const res = await fetch(`/api/hotel/room-types/${categoryToDelete.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setManageCategoryError(errData.error || "Failed to delete category");
        return;
      }

      // Remove from room categories state
      setRoomCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));

      // If current room form was using this category, fall back safely to 'Standard'
      if (newRoomType.toLowerCase() === categoryToDelete.name.toLowerCase()) {
        setNewRoomType('Standard');
        setNewRoomPrice(1500);
      }

      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      setManageCategoryError("Network error while deleting category");
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim() || !newRoomFloorId) return;

    setIsSubmitting(true);
    try {
      const method = editingRoomId ? 'PATCH' : 'POST';
      const url = editingRoomId ? `/api/hotel/rooms/${editingRoomId}` : '/api/hotel/rooms';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          floorId: newRoomFloorId,
          roomTypeName: newRoomType,
          roomNumber: newRoomNumber,
          status: newRoomStatus,
          basePrice: newRoomPrice,
          capacity: newRoomCapacity,
          staff: newRoomStaff,
          amenities: newRoomAmenities,
          notes: newRoomNotes
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || `Failed to ${editingRoomId ? 'update' : 'create'} room`);
        return;
      }

      onSuccess();
      onClose();
      resetRoomForm();
    } catch (error) {
      console.error(error);
      alert(`Network error while ${editingRoomId ? 'updating' : 'creating'} room`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Hotel size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {editingRoomId ? `Edit Room — Room ${newRoomNumber || initialData?.roomNumber || initialData?.number || ''}`.trim() : 'Add New Room'}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">{editingRoomId ? 'Update room details and configuration' : 'Create a room and configure its details'}</p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); resetRoomForm(); }}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={21} />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto p-7">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* LEFT */}
            <div className="space-y-6">

              {/* ROOM DETAILS */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Hotel size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Room Details</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Basic information about the room</p>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Select Floor <span className="ml-1 text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        value={newRoomFloorId}
                        onChange={(e) => setNewRoomFloorId(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 appearance-none"
                        required
                      >
                        <option value="" disabled>Choose a floor</option>
                        {floors.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Room Number <span className="ml-1 text-red-500">*</span></label>
                      <input
                        type="text"
                        value={newRoomNumber}
                        onChange={(e) => setNewRoomNumber(e.target.value)}
                        placeholder="e.g. 301"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-slate-700">Room Type <span className="ml-1 text-red-500">*</span></label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsManageCategoriesOpen(true);
                              setManageCategoryError(null);
                              setEditingCategory(null);
                              setCategoryToDelete(null);
                            }}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
                            title="Manage custom categories"
                          >
                            <Settings2 size={13} />
                            <span>Manage</span>
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddCategoryForm(!showAddCategoryForm);
                              setCategoryError(null);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                            {showAddCategoryForm ? 'Cancel' : 'Add Category'}
                          </button>
                        </div>
                      </div>

                      {/* INLINE ADD CATEGORY FORM */}
                      {showAddCategoryForm && (
                        <div className="mb-3 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">New Room Category</span>
                            <button
                              type="button"
                              onClick={() => setShowAddCategoryForm(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {categoryError && (
                            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-lg">
                              {categoryError}
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Category Name</label>
                              <input
                                type="text"
                                value={customCategoryName}
                                onChange={(e) => setCustomCategoryName(e.target.value)}
                                placeholder="e.g. Executive, Penthouse"
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                disabled={isCreatingCategory}
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">Base Price (₹ / night)</label>
                              <input
                                type="number"
                                min="0"
                                value={customCategoryBasePrice}
                                onChange={(e) => setCustomCategoryBasePrice(Number(e.target.value) || 0)}
                                placeholder="2000"
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                                disabled={isCreatingCategory}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleCreateCategory}
                              disabled={isCreatingCategory || !customCategoryName.trim()}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isCreatingCategory && <Loader2 size={12} className="animate-spin" />}
                              <span>{isCreatingCategory ? 'Saving...' : 'Save Category'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        <select
                          value={newRoomType}
                          onChange={(e) => handleSelectRoomType(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 appearance-none"
                        >
                          {allCategoryNames.map(name => {
                            const matchedCat = roomCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
                            const priceLabel = matchedCat?.basePrice ? ` · ₹${Math.round(matchedCat.basePrice / 100)}` : '';
                            return (
                              <option key={name} value={name}>
                                {name}{priceLabel}
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* CAPACITY + PRICE */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Capacity & Pricing</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Set occupancy and room rate</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Capacity</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={newRoomCapacity}
                        onChange={(e) => setNewRoomCapacity(parseInt(e.target.value) || 1)}
                        placeholder="2"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Guests</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Base Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={newRoomPrice}
                        onChange={(e) => setNewRoomPrice(parseInt(e.target.value) || 0)}
                        placeholder="1500"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">/ night</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* STATUS */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <UserRound size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Status & Management</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Room availability and assignment</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Initial Status</label>
                    <div className="relative">
                      <select
                        value={newRoomStatus}
                        onChange={(e) => setNewRoomStatus(e.target.value as RoomStatus)}
                        disabled={editingRoomId !== null && editingRoomHasGuest}
                        className={`h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition appearance-none ${editingRoomId && editingRoomHasGuest ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'}`}
                      >
                        <option value="AVAILABLE">Available</option>

                        <option value="OCCUPIED">Occupied</option>
                        <option value="DIRTY">Dirty</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                      <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Assigned Cleaner</label>
                    <div className="relative">
                      <select
                        value={newRoomStaff}
                        onChange={(e) => setNewRoomStaff(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 pr-10 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 appearance-none text-slate-500"
                      >
                        <option value="">Unassigned</option>
                        <option value="Ramesh">Ramesh (HK)</option>
                        <option value="Sita">Sita (HK)</option>
                      </select>
                      <ChevronDown size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">

              {/* AMENITIES */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Snowflake size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Amenities & Features</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Select everything included</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-2">
                  {[
                    { id: 'AC / Heater', icon: <Snowflake size={18} /> },
                    { id: 'Wi-Fi', icon: <Wifi size={18} /> },
                    { id: 'TV', icon: <Tv size={18} /> },
                    { id: 'Attached Bathroom / Geyser', icon: <Bath size={18} /> },
                    { id: 'Balcony View', icon: <Mountain size={18} /> },
                  ].map((amenity) => {
                    const selected = newRoomAmenities.includes(amenity.id);
                    return (
                      <button
                        type="button"
                        key={amenity.id}
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`group flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${selected
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                              }`}
                          >
                            {amenity.icon}
                          </div>
                          <span className={`text-sm font-medium ${selected ? "text-indigo-900" : "text-slate-700"}`}>
                            {amenity.id}
                          </span>
                        </div>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                            }`}
                        >
                          {selected && <Check size={13} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* DESCRIPTION */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Hotel size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Additional Details</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Optional notes about this room</p>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Description / Notes</label>
                  <textarea
                    rows={6}
                    value={newRoomNotes}
                    onChange={(e) => setNewRoomNotes(e.target.value)}
                    placeholder="e.g. Corner room with a great view..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </section>

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-7 py-4 shrink-0">
          <p className="hidden text-xs text-slate-400 sm:block">
            Fields marked with <span className="text-red-500">*</span> are required
          </p>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => { onClose(); resetRoomForm(); }}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRoom}
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98] ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <Check size={17} />
              {isSubmitting
                ? (editingRoomId ? 'Updating...' : 'Saving...')
                : (editingRoomId ? 'Update Room' : 'Save Room')}
            </button>
          </div>
        </div>

      </div>

      {/* MANAGE ROOM CATEGORIES MODAL */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Settings2 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Manage Room Categories</h3>
                  <p className="text-xs text-slate-400">Edit or delete custom room categories for this hotel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManageCategoriesOpen(false);
                  setEditingCategory(null);
                  setCategoryToDelete(null);
                  setManageCategoryError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {manageCategoryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 leading-relaxed">
                  {manageCategoryError}
                </div>
              )}

              {/* EDIT FORM IF A CATEGORY IS SELECTED FOR EDITING */}
              {editingCategory ? (
                <form onSubmit={handleUpdateCategory} className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Edit Category: {editingCategory.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Category Name</label>
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                        required
                        disabled={isSavingCategoryEdit}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Default Base Price (₹)</label>
                      <input
                        type="number"
                        min="1"
                        value={editCategoryPrice}
                        onChange={(e) => setEditCategoryPrice(Number(e.target.value) || 0)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                        required
                        disabled={isSavingCategoryEdit}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      disabled={isSavingCategoryEdit}
                      className="px-3 py-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingCategoryEdit || !editCategoryName.trim()}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingCategoryEdit && <Loader2 size={12} className="animate-spin" />}
                      <span>{isSavingCategoryEdit ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              ) : null}

              {/* DELETE CONFIRMATION DIALOG */}
              {categoryToDelete ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-rose-950">
                    Delete &ldquo;{categoryToDelete.name}&rdquo;?
                  </h4>
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    This action will remove the category from selection. If active rooms are assigned to this category, deletion will be blocked by system safeguards.
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(null)}
                      disabled={isDeletingCategory}
                      className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCategory}
                      disabled={isDeletingCategory}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {isDeletingCategory && <Loader2 size={12} className="animate-spin" />}
                      <span>{isDeletingCategory ? 'Deleting...' : 'Confirm Delete'}</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* CATEGORIES LIST */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Hotel Room Categories ({roomCategories.length})
                </span>

                {roomCategories.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No custom categories saved yet. Use &ldquo;Add Category&rdquo; to create one.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                    {roomCategories.map((cat) => (
                      <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              ₹{Math.round((cat.basePrice || 0) / 100)} / night
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Custom category
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setEditCategoryName(cat.name);
                              setEditCategoryPrice(Math.round((cat.basePrice || 0) / 100));
                              setCategoryToDelete(null);
                              setManageCategoryError(null);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit category"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryToDelete(cat);
                              setEditingCategory(null);
                              setManageCategoryError(null);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-3.5 bg-slate-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsManageCategoriesOpen(false);
                  setEditingCategory(null);
                  setCategoryToDelete(null);
                  setManageCategoryError(null);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
