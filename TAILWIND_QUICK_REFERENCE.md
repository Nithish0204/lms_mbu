# Tailwind CSS Quick Reference - Hubexus LMS

## ✅ Conversion Status: **COMPLETE**

Your frontend has already been fully converted to Tailwind CSS! All Material-UI components have been replaced with Tailwind utility classes.

---

## 🎨 Design System

### Color Palette

```javascript
Primary (Blue):
- primary-50: #e3f2fd (lightest)
- primary-500: #1976d2 (main)
- primary-600: #1565c0 (hover)

Secondary (Orange):
- secondary-500: #ff9800 (main)
- secondary-600: #fb8c00 (hover)

Neutrals:
- gray-50: Background
- gray-100-900: Various UI elements
```

---

## 🧩 Reusable Component Patterns

### Buttons

**Primary Button**

```jsx
<button className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
  Click Me
</button>
```

**Secondary Button**

```jsx
<button className="bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
  Secondary
</button>
```

**Outline Button**

```jsx
<button className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
  Outline
</button>
```

**Disabled Button**

```jsx
<button
  disabled
  className="bg-gray-300 text-gray-500 cursor-not-allowed py-2 px-4 rounded-lg"
>
  Disabled
</button>
```

---

### Cards

**Basic Card**

```jsx
<div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
  <h3 className="text-xl font-bold text-gray-900 mb-2">Title</h3>
  <p className="text-gray-600">Content here...</p>
</div>
```

**Card with Gradient Header**

```jsx
<div className="bg-white rounded-lg shadow-lg overflow-hidden">
  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4">
    <h3 className="text-white font-bold text-xl">Featured</h3>
  </div>
  <div className="p-6">
    <p className="text-gray-600">Card content...</p>
  </div>
</div>
```

---

### Forms

**Input Field**

```jsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Email Address
  </label>
  <input
    type="email"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
    placeholder="you@example.com"
  />
</div>
```

**Select Dropdown**

```jsx
<select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

**Textarea**

```jsx
<textarea
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
  rows="4"
  placeholder="Enter description..."
></textarea>
```

---

### Alerts

**Success Alert**

```jsx
<div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
  <div className="flex">
    <div className="flex-shrink-0">
      <svg
        className="h-5 w-5 text-green-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    </div>
    <div className="ml-3">
      <p className="text-sm text-green-700">Success message here!</p>
    </div>
  </div>
</div>
```

**Error Alert**

```jsx
<div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
  <div className="flex">
    <div className="flex-shrink-0">
      <svg
        className="h-5 w-5 text-red-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    </div>
    <div className="ml-3">
      <p className="text-sm text-red-700">Error message here!</p>
    </div>
  </div>
</div>
```

**Info Alert**

```jsx
<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
  <p className="text-sm text-blue-700">Information message here!</p>
</div>
```

---

### Badges

**Role Badge (Student)**

```jsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
  Student
</span>
```

**Role Badge (Teacher)**

```jsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
  Teacher
</span>
```

**Status Badge**

```jsx
<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
  Pending
</span>
```

---

### Avatars

**User Avatar with Initials**

```jsx
<div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
  <span className="text-white font-bold text-lg">JD</span>
</div>
```

**Small Avatar**

```jsx
<div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
  <span className="text-gray-600 font-medium text-sm">U</span>
</div>
```

---

### Loading States

**Spinner**

```jsx
<div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
</div>
```

**Button with Loading**

```jsx
<button
  disabled
  className="bg-primary-500 text-white py-2 px-4 rounded-lg flex items-center"
>
  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
  Loading...
</button>
```

---

### Navigation

**Navbar Link**

```jsx
<Link
  to="/dashboard"
  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
>
  Dashboard
</Link>
```

**Active Link**

```jsx
<Link
  to="/dashboard"
  className="text-primary-600 bg-primary-50 px-3 py-2 rounded-md text-sm font-medium"
>
  Dashboard
</Link>
```

---

### Tables

**Simple Table**

```jsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Email
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      <tr>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          John Doe
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          john@example.com
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Modals

**Simple Modal**

```jsx
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
  <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
    <h3 className="text-lg font-bold text-gray-900 mb-4">Modal Title</h3>
    <p className="text-gray-600 mb-6">Modal content goes here...</p>
    <div className="flex justify-end space-x-3">
      <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## 📱 Responsive Design

### Breakpoints

```
sm: 640px   (Tablet)
md: 768px   (Small Desktop)
lg: 1024px  (Desktop)
xl: 1280px  (Large Desktop)
```

### Responsive Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards here */}
</div>
```

### Responsive Text

```jsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
```

### Hide/Show on Mobile

```jsx
{
  /* Hide on mobile, show on desktop */
}
<div className="hidden md:block">Desktop only</div>;

{
  /* Show on mobile, hide on desktop */
}
<div className="block md:hidden">Mobile only</div>;
```

---

## 🎯 Common Patterns in LMS

### Course Card

```jsx
<div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
  <div className="h-40 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
  <div className="p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-2">Course Title</h3>
    <p className="text-gray-600 mb-4">Course description...</p>
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">8 weeks</span>
      <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">
        Enroll
      </button>
    </div>
  </div>
</div>
```

### Dashboard Stat Card

```jsx
<div className="bg-white rounded-lg shadow p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600 mb-1">Total Courses</p>
      <p className="text-3xl font-bold text-gray-900">12</p>
    </div>
    <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
      <svg
        className="h-6 w-6 text-primary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {/* Icon path */}
      </svg>
    </div>
  </div>
</div>
```

---

## 🚀 Running the Application

```bash
# Start frontend
cd frontend
npm start

# Visit
http://localhost:3000
```

---

## ✅ Status: Complete!

All components are using Tailwind CSS with a modern, professional design. No further conversion needed!

---

**Date:** October 17, 2025  
**Framework:** Tailwind CSS 3.4.0  
**Status:** ✅ Production Ready
