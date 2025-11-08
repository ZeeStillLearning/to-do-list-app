import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";

const TodoList = ({ user }) => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "todos"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort by completed status and creation time
      todosData.sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setTodos(todosData);
    });

    return () => unsubscribe();
  }, [user]);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "todos"), {
        text: newTodo,
        completed: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewTodo("");
    } catch (err) {
      console.error("Error adding todo:", err);
      alert("Failed to add todo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      await updateDoc(doc(db, "todos", id), {
        completed: !completed,
      });
    } catch (err) {
      console.error("Error updating todo:", err);
      alert("Failed to update todo. Please try again.");
    }
  };

  const deleteTodo = async (id) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    try {
      await deleteDoc(doc(db, "todos", id));
    } catch (err) {
      console.error("Error deleting todo:", err);
      alert("Failed to delete todo. Please try again.");
    }
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const activeTodos = todos.filter((t) => !t.completed).length;
  const completedTodos = todos.filter((t) => t.completed).length;

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await signOut(auth);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Header - Fixed */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">✓</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  My Tasks
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  {user.email}
                </p>
              </div>
            </div>

            {/* User Menu - Mobile & Desktop */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-gray-600 hidden sm:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <aside className=" space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <div className="text-2xl sm:text-3xl font-bold text-gray-800">
              {todos.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">
              Total Tasks
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {activeTodos}
            </div>
            <div className="text-xs sm:text-sm text-blue-100 mt-1">Active</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {completedTodos}
            </div>
            <div className="text-xs sm:text-sm text-green-100 mt-1">Done</div>
          </div>
        </div>

        {/* Add Todo Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <form onSubmit={addTodo} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm sm:text-base transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newTodo.trim()}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md text-sm sm:text-base whitespace-nowrap"
            >
              {loading ? "..." : "+ Add"}
            </button>
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-6">
          <div className="flex gap-2">
            {[
              { id: "all", label: "All", icon: "📋" },
              { id: "active", label: "Active", icon: "⏳" },
              { id: "completed", label: "Done", icon: "✅" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition font-medium text-sm sm:text-base ${
                  filter === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="hidden sm:inline mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        </aside>

        <section className="lg:col-span-2">
        {/* Todo List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-6xl sm:text-7xl mb-4">
                {filter === "completed"
                  ? "🎉"
                  : filter === "active"
                  ? "📝"
                  : "📭"}
              </div>
              <p className="text-lg sm:text-xl font-medium text-gray-800 mb-2">
                {filter === "completed"
                  ? "No completed tasks yet"
                  : filter === "active"
                  ? "No active tasks"
                  : "No tasks yet"}
              </p>
              <p className="text-sm text-gray-500">
                {filter === "all" && "Add a new task to get started!"}
                {filter === "active" && "All tasks are completed! 🎊"}
                {filter === "completed" &&
                  "Complete some tasks to see them here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="group p-4 sm:p-5 hover:bg-gray-50 transition flex items-start gap-3 sm:gap-4"
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition ${
                        todo.completed
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-500"
                          : "border-gray-300 hover:border-indigo-500"
                      }`}
                    >
                      {todo.completed && (
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Todo Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm sm:text-base break-words ${
                        todo.completed
                          ? "line-through text-gray-400"
                          : "text-gray-800"
                      }`}
                    >
                      {todo.text}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition p-2 hover:bg-red-50 rounded-lg"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {todos.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              {activeTodos > 0
                ? `${activeTodos} task${activeTodos === 1 ? "" : "s"} remaining`
                : "All tasks completed! Great job! 🎉"}
            </p>
          </div>
        )}
        </section>
      </main>
    </div>
  );
};

export default TodoList;
