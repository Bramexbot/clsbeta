import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import './App.css';
import { Editor } from '@monaco-editor/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Programming Languages (Expanded)
const LANGUAGES = {
  javascript: {
    name: 'JavaScript',
    icon: '🟨',
    color: 'yellow',
    fileExtension: 'js',
    monacoLanguage: 'javascript',
    execution: 'client'
  },
  python: {
    name: 'Python',
    icon: '🐍',
    color: 'blue',
    fileExtension: 'py',
    monacoLanguage: 'python',
    execution: 'client'
  },
  html: {
    name: 'HTML/CSS',
    icon: '🌐',
    color: 'orange',
    fileExtension: 'html',
    monacoLanguage: 'html',
    execution: 'client'
  },
  java: {
    name: 'Java',
    icon: '☕',
    color: 'red',
    fileExtension: 'java',
    monacoLanguage: 'java',
    execution: 'server'
  },
  cpp: {
    name: 'C++',
    icon: '⚡',
    color: 'purple',
    fileExtension: 'cpp',
    monacoLanguage: 'cpp',
    execution: 'server'
  },
  ruby: {
    name: 'Ruby',
    icon: '💎',
    color: 'red',
    fileExtension: 'rb',
    monacoLanguage: 'ruby',
    execution: 'server'
  },
  go: {
    name: 'Go',
    icon: '🔵',
    color: 'blue',
    fileExtension: 'go',
    monacoLanguage: 'go',
    execution: 'server'
  }
};

// Tutorial data organized by language (Expanded)
const TUTORIALS = {
  javascript: [
    {
      id: 1,
      title: "Hello World",
      description: "Learn to print your first message",
      difficulty: "Beginner",
      instructions: [
        "Welcome to JavaScript! Let's start with the classic 'Hello World' program.",
        "Type: console.log('Hello World'); in the editor",
        "Click 'Run Code' to see the output",
        "Try changing the message to something else!"
      ],
      starterCode: "// Welcome! Type your first line of code here\n// Try: console.log('Hello World');\n\n",
      hints: [
        "Use console.log() to print messages",
        "Don't forget the semicolon at the end!",
        "Strings should be wrapped in quotes"
      ]
    },
    {
      id: 2,
      title: "Variables",
      description: "Learn to store and use data",
      difficulty: "Beginner",
      instructions: [
        "Variables are containers that store data values.",
        "Create a variable: let name = 'Your Name';",
        "Print it: console.log(name);",
        "Try creating variables for your age and favorite color!"
      ],
      starterCode: "// Create variables to store information\n// Example: let name = 'Alex';\n\n",
      hints: [
        "Use 'let' to create variables",
        "Variable names cannot have spaces",
        "Remember to assign values with ="
      ]
    },
    {
      id: 3,
      title: "Math Operations",
      description: "Perform calculations with code",
      difficulty: "Beginner",
      instructions: [
        "Computers are great at math! Let's try some calculations.",
        "Try: console.log(5 + 3);",
        "Experiment with -, *, / (division)",
        "Create variables and do math with them!"
      ],
      starterCode: "// Try some math operations\n// Example: console.log(10 + 5);\n\n",
      hints: [
        "Use +, -, *, / for basic math",
        "You can use parentheses for order of operations",
        "Variables can store numbers too!"
      ]
    },
    {
      id: 4,
      title: "Functions",
      description: "Create reusable blocks of code",
      difficulty: "Intermediate",
      instructions: [
        "Functions are reusable blocks of code that perform specific tasks.",
        "Create a function: function greet() { console.log('Hi!'); }",
        "Call it: greet();",
        "Try creating a function that takes a parameter!"
      ],
      starterCode: "// Create your first function\n// function sayHello() {\n//   console.log('Hello!');\n// }\n// sayHello();\n\n",
      hints: [
        "Functions are defined with the 'function' keyword",
        "Don't forget to call your function with ()",
        "Parameters go inside the parentheses"
      ]
    }
  ],
  python: [
    {
      id: 1,
      title: "Hello World",
      description: "Print your first Python message",
      difficulty: "Beginner",
      instructions: [
        "Welcome to Python! Let's start with printing a message.",
        "Type: print('Hello World') in the editor",
        "Click 'Run Code' to see the output",
        "Python is clean and easy to read!"
      ],
      starterCode: "# Welcome to Python!\n# Try: print('Hello World')\n\n",
      hints: [
        "Use print() to display messages",
        "Python doesn't need semicolons",
        "Strings can use single or double quotes"
      ]
    },
    {
      id: 2,
      title: "Variables",
      description: "Store data in Python variables",
      difficulty: "Beginner",
      instructions: [
        "Python variables are simple and flexible.",
        "Create a variable: name = 'Your Name'",
        "Print it: print(name)",
        "Try storing numbers, text, and more!"
      ],
      starterCode: "# Create variables in Python\n# Example: name = 'Alex'\n# print(name)\n\n",
      hints: [
        "No need for 'let' or 'var' keywords",
        "Python automatically detects data types",
        "Variable names use lowercase_with_underscores"
      ]
    },
    {
      id: 3,
      title: "Math & Numbers",
      description: "Work with numbers in Python",
      difficulty: "Beginner",
      instructions: [
        "Python makes math operations simple and intuitive.",
        "Try: print(5 + 3)",
        "Python supports +, -, *, /, // (floor division), ** (power)",
        "Store calculations in variables!"
      ],
      starterCode: "# Try math operations in Python\n# Example: result = 10 + 5\n# print(result)\n\n",
      hints: [
        "** means 'to the power of' (e.g., 2**3 = 8)",
        "// gives you whole number division",
        "Python handles big numbers automatically"
      ]
    },
    {
      id: 4,
      title: "Functions",
      description: "Create reusable Python functions",
      difficulty: "Intermediate",
      instructions: [
        "Python functions are defined with 'def' keyword.",
        "Create: def greet(): print('Hi!')",
        "Call it: greet()",
        "Try functions with parameters!"
      ],
      starterCode: "# Create your first Python function\n# def say_hello():\n#     print('Hello!')\n# \n# say_hello()\n\n",
      hints: [
        "Use 'def' to define functions",
        "Indentation is important in Python",
        "Function names use lowercase_with_underscores"
      ]
    }
  ],
  html: [
    {
      id: 1,
      title: "Hello Web",
      description: "Create your first webpage",
      difficulty: "Beginner",
      instructions: [
        "HTML creates the structure of web pages.",
        "Type: <h1>Hello World</h1> in the editor",
        "Click 'Run Code' to see it rendered",
        "Try different heading sizes: h1, h2, h3!"
      ],
      starterCode: "<!-- Welcome to HTML! -->\n<!-- Try: <h1>Hello World</h1> -->\n\n",
      hints: [
        "HTML uses tags like <tag>content</tag>",
        "h1 is the biggest heading, h6 is smallest",
        "Always close your tags!"
      ]
    },
    {
      id: 2,
      title: "Text & Paragraphs",
      description: "Add text content to your page",
      difficulty: "Beginner",
      instructions: [
        "Use <p> tags for paragraphs of text.",
        "Try: <p>This is a paragraph.</p>",
        "Add multiple paragraphs and see the spacing",
        "Use <strong> for bold and <em> for italic!"
      ],
      starterCode: "<!-- Create paragraphs and text formatting -->\n<!-- <p>Your paragraph here</p> -->\n<!-- <strong>Bold text</strong> -->\n<!-- <em>Italic text</em> -->\n\n",
      hints: [
        "<p> creates paragraph spacing",
        "<strong> makes text bold",
        "<em> makes text italic"
      ]
    },
    {
      id: 3,
      title: "Colors & Styling",
      description: "Add colors with CSS",
      difficulty: "Beginner",
      instructions: [
        "CSS adds colors and styling to HTML.",
        "Add: <style>h1 { color: blue; }</style> in the <head>",
        "Try different colors: red, green, purple, #ff0000",
        "Style paragraphs too!"
      ],
      starterCode: "<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* Add your CSS here */\n    /* h1 { color: blue; } */\n  </style>\n</head>\n<body>\n  <h1>Styled Heading</h1>\n  <p>Add some styling!</p>\n</body>\n</html>",
      hints: [
        "CSS goes inside <style> tags",
        "Use { } to define style rules",
        "Try: color, background-color, font-size"
      ]
    },
    {
      id: 4,
      title: "Layout & Structure",
      description: "Organize your webpage",
      difficulty: "Intermediate",
      instructions: [
        "Use <div> to group elements together.",
        "Create sections with headers and content",
        "Try: <div class='section'>content</div>",
        "Style your sections with CSS!"
      ],
      starterCode: "<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    .section {\n      padding: 20px;\n      margin: 10px;\n      background-color: #f0f0f0;\n    }\n  </style>\n</head>\n<body>\n  <div class='section'>\n    <h2>Section Title</h2>\n    <p>Section content goes here.</p>\n  </div>\n</body>\n</html>",
      hints: [
        "<div> creates invisible containers",
        "Use class='name' to apply CSS styles",
        "padding adds space inside, margin adds space outside"
      ]
    }
  ],
  java: [
    {
      id: 1,
      title: "Hello Java",
      description: "Your first Java program",
      difficulty: "Beginner",
      instructions: [
        "Java programs start with a main method.",
        "Copy this code and see how Java works:",
        "System.out.println() prints messages to console",
        "Every statement ends with a semicolon!"
      ],
      starterCode: "public class Main {\n    public static void main(String[] args) {\n        // Try: System.out.println(\"Hello Java!\");\n        \n    }\n}",
      hints: [
        "Java is case-sensitive",
        "Every Java program needs a main method",
        "Use System.out.println() to print"
      ]
    },
    {
      id: 2,
      title: "Variables in Java",
      description: "Learn Java data types",
      difficulty: "Beginner",
      instructions: [
        "Java variables must declare their type.",
        "Try: int age = 25;",
        "Try: String name = \"Alex\";",
        "Print them with System.out.println(age);"
      ],
      starterCode: "public class Main {\n    public static void main(String[] args) {\n        // Create variables with types\n        // int number = 42;\n        // String text = \"Hello\";\n        \n    }\n}",
      hints: [
        "Common types: int, double, String, boolean",
        "String starts with capital S",
        "Use double quotes for Strings"
      ]
    }
  ],
  cpp: [
    {
      id: 1,
      title: "Hello C++",
      description: "Your first C++ program",
      difficulty: "Beginner",
      instructions: [
        "C++ is a powerful programming language.",
        "Copy this code to see C++ in action:",
        "std::cout prints to the console",
        "Don't forget the #include statements!"
      ],
      starterCode: "#include <iostream>\n\nint main() {\n    // Try: std::cout << \"Hello C++!\" << std::endl;\n    \n    return 0;\n}",
      hints: [
        "Always include <iostream> for cout",
        "Use std::cout << to print",
        "End with std::endl for new line"
      ]
    }
  ],
  ruby: [
    {
      id: 1,
      title: "Hello Ruby",
      description: "Your first Ruby program",
      difficulty: "Beginner",
      instructions: [
        "Ruby is known for being simple and elegant.",
        "Try: puts 'Hello Ruby!'",
        "Ruby doesn't need semicolons",
        "It's designed to be easy to read and write!"
      ],
      starterCode: "# Welcome to Ruby!\n# Try: puts 'Hello Ruby!'\n\n",
      hints: [
        "Use 'puts' to print with a new line",
        "Use 'print' to print without new line",
        "Ruby is very flexible with syntax"
      ]
    }
  ],
  go: [
    {
      id: 1,
      title: "Hello Go",
      description: "Your first Go program",
      difficulty: "Beginner",
      instructions: [
        "Go is a modern language created by Google.",
        "Copy this code to see Go in action:",
        "fmt.Println() prints to console",
        "Go is fast and efficient!"
      ],
      starterCode: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Try: fmt.Println(\"Hello Go!\")\n    \n}",
      hints: [
        "Every Go program starts with 'package main'",
        "Import fmt for printing functions",
        "Use fmt.Println() to print with new line"
      ]
    }
  ]
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (username, email, password, fullName) => {
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail };
      }
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ onClose, darkMode }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    loadUsers();
    loadErrors();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadErrors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/admin/errors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setErrors(data);
      }
    } catch (error) {
      console.error('Failed to load errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const themeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-white',
    card: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    border: darkMode ? 'border-gray-600' : 'border-gray-300',
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`${themeClasses.bg} rounded-xl p-8`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={themeClasses.text}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.bg} rounded-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-600">
          <h2 className={`text-2xl font-bold ${themeClasses.text}`}>
            🛡️ Code Learning Scripter Admin
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600">
          {['overview', 'users', 'errors'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : themeClasses.text
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && dashboardData && (
            <div className="space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${themeClasses.card} p-4 rounded-lg border ${themeClasses.border}`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Total Users</h3>
                  <p className="text-3xl font-bold text-blue-600">{dashboardData.user_stats.total_users}</p>
                </div>
                <div className={`${themeClasses.card} p-4 rounded-lg border ${themeClasses.border}`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Active Today</h3>
                  <p className="text-3xl font-bold text-green-600">{dashboardData.user_stats.active_today}</p>
                </div>
                <div className={`${themeClasses.card} p-4 rounded-lg border ${themeClasses.border}`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Active This Week</h3>
                  <p className="text-3xl font-bold text-yellow-600">{dashboardData.user_stats.active_this_week}</p>
                </div>
                <div className={`${themeClasses.card} p-4 rounded-lg border ${themeClasses.border}`}>
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>New This Week</h3>
                  <p className="text-3xl font-bold text-purple-600">{dashboardData.user_stats.new_this_week}</p>
                </div>
              </div>

              {/* Language Stats */}
              <div className={`${themeClasses.card} p-6 rounded-lg border ${themeClasses.border}`}>
                <h3 className={`text-xl font-bold ${themeClasses.text} mb-4`}>Language Popularity</h3>
                <div className="space-y-3">
                  {dashboardData.language_stats.map((lang) => (
                    <div key={lang.language} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{LANGUAGES[lang.language]?.icon || '📝'}</span>
                        <span className={`font-medium ${themeClasses.text}`}>
                          {LANGUAGES[lang.language]?.name || lang.language}
                        </span>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <span className={themeClasses.textSecondary}>
                          {lang.total_users} users
                        </span>
                        <span className={themeClasses.textSecondary}>
                          {Math.round(lang.avg_completion_rate * 100)}% completion
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className={`${themeClasses.card} p-6 rounded-lg border ${themeClasses.border}`}>
                <h3 className={`text-xl font-bold ${themeClasses.text} mb-4`}>Recent Activity</h3>
                <div className="space-y-2">
                  {dashboardData.recent_activity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-600">
                          {activity.username}
                        </span>
                        <span className={`text-sm ${themeClasses.textSecondary}`}>
                          {activity.completed ? 'completed' : 'worked on'}
                        </span>
                        <span className="text-sm font-medium">
                          {LANGUAGES[activity.language]?.name} Tutorial {activity.tutorial_id}
                        </span>
                      </div>
                      <span className={`text-xs ${themeClasses.textSecondary}`}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className={`${themeClasses.card} rounded-lg border ${themeClasses.border}`}>
              <div className="p-4 border-b border-gray-600">
                <h3 className={`text-xl font-bold ${themeClasses.text}`}>User Analytics</h3>
              </div>
              <div className="overflow-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className={`px-4 py-2 text-left ${themeClasses.text}`}>Username</th>
                      <th className={`px-4 py-2 text-left ${themeClasses.text}`}>Email</th>
                      <th className={`px-4 py-2 text-left ${themeClasses.text}`}>Progress</th>
                      <th className={`px-4 py-2 text-left ${themeClasses.text}`}>Completions</th>
                      <th className={`px-4 py-2 text-left ${themeClasses.text}`}>Last Activity</th>
                      <th className={`px-4 py-2 text-left ${themeClasses.text}`}>Current Language</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className={`border-b ${themeClasses.border}`}>
                        <td className={`px-4 py-2 ${themeClasses.text}`}>{user.username}</td>
                        <td className={`px-4 py-2 ${themeClasses.textSecondary}`}>{user.email}</td>
                        <td className={`px-4 py-2 ${themeClasses.text}`}>{user.total_progress}</td>
                        <td className={`px-4 py-2 text-green-600 font-medium`}>{user.completions}</td>
                        <td className={`px-4 py-2 ${themeClasses.textSecondary} text-sm`}>
                          {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'}
                        </td>
                        <td className={`px-4 py-2 ${themeClasses.text}`}>
                          {user.current_language ? (
                            <span className="flex items-center space-x-1">
                              <span>{LANGUAGES[user.current_language]?.icon}</span>
                              <span>{LANGUAGES[user.current_language]?.name}</span>
                            </span>
                          ) : (
                            'None'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className={`${themeClasses.card} p-6 rounded-lg border ${themeClasses.border}`}>
              <h3 className={`text-xl font-bold ${themeClasses.text} mb-4`}>Common Errors</h3>
              <div className="space-y-3">
                {errors.map((error, index) => (
                  <div key={index} className={`p-3 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'} rounded-lg`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span>{LANGUAGES[error.language]?.icon}</span>
                        <span className="font-medium">{LANGUAGES[error.language]?.name}</span>
                      </div>
                      <span className="text-sm bg-red-600 text-white px-2 py-1 rounded">
                        {error.count} times
                      </span>
                    </div>
                    <code className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                      {error.error}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Login Modal Component
const AuthModal = ({ isOpen, onClose, mode, onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let result;
    if (mode === 'login') {
      result = await login(email, password);
    } else {
      result = await register(username, email, password, fullName);
    }

    if (result.success) {
      onClose();
      setEmail('');
      setPassword('');
      setUsername('');
      setFullName('');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Welcome Back!' : 'Join Code Learning Scripter'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={onSwitchMode}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>

        {mode === 'login' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Admin Demo:</strong>
            </p>
            <p className="text-xs text-gray-500">
              Email: admin@cl-scripter.com<br/>
              Password: scripter2024
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Projects Workspace Component (BETA)
const ProjectsWorkspace = ({ darkMode }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectCode, setProjectCode] = useState('');
  const [projectOutput, setProjectOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('javascript');
  const editorRef = useRef(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('userProjects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      setProjects(parsedProjects);
      if (parsedProjects.length > 0) {
        setCurrentProject(parsedProjects[0]);
        setProjectCode(parsedProjects[0].code);
      }
    }
  }, []);

  // Save projects to localStorage
  const saveProjects = (updatedProjects) => {
    setProjects(updatedProjects);
    localStorage.setItem('userProjects', JSON.stringify(updatedProjects));
  };

  // Create new project
  const createProject = () => {
    if (!newProjectName.trim()) return;

    const starterCodes = {
      javascript: '// Welcome to your new JavaScript project!\nconsole.log("Hello from your project!");\n\n',
      python: '# Welcome to your new Python project!\nprint("Hello from your project!")\n\n',
      html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Project</title>\n    <style>\n        body { font-family: Arial, sans-serif; }\n    </style>\n</head>\n<body>\n    <h1>Welcome to My Project!</h1>\n    <p>Start building something amazing!</p>\n</body>\n</html>',
      java: 'public class MyProject {\n    public static void main(String[] args) {\n        System.out.println("Hello from your Java project!");\n    }\n}',
      cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello from your C++ project!" << std::endl;\n    return 0;\n}',
      ruby: '# Welcome to your new Ruby project!\nputs "Hello from your project!"\n\n',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from your Go project!")\n}'
    };

    const newProject = {
      id: Date.now().toString(),
      name: newProjectName,
      type: newProjectType,
      code: starterCodes[newProjectType] || '// Start coding!',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const updatedProjects = [newProject, ...projects];
    saveProjects(updatedProjects);
    setCurrentProject(newProject);
    setProjectCode(newProject.code);
    setNewProjectName('');
    setShowNewProjectModal(false);
  };

  // Save current project
  const saveCurrentProject = () => {
    if (!currentProject) return;

    const updatedProjects = projects.map(p => 
      p.id === currentProject.id 
        ? { ...p, code: projectCode, lastModified: new Date().toISOString() }
        : p
    );
    saveProjects(updatedProjects);
    setCurrentProject({ ...currentProject, code: projectCode, lastModified: new Date().toISOString() });
  };

  // Delete project
  const deleteProject = (projectId) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjects(updatedProjects);
    
    if (currentProject?.id === projectId) {
      if (updatedProjects.length > 0) {
        setCurrentProject(updatedProjects[0]);
        setProjectCode(updatedProjects[0].code);
      } else {
        setCurrentProject(null);
        setProjectCode('');
      }
    }
  };

  // Switch project
  const switchProject = (project) => {
    saveCurrentProject(); // Save current before switching
    setCurrentProject(project);
    setProjectCode(project.code);
    setProjectOutput('');
  };

  // Download project
  const downloadProject = () => {
    if (!currentProject) return;

    const blob = new Blob([projectCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}.${LANGUAGES[currentProject.type]?.fileExtension || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Run project code
  const runProjectCode = () => {
    setIsRunning(true);
    setProjectOutput('');

    try {
      if (currentProject.type === 'javascript') {
        const logs = [];
        const originalLog = console.log;
        
        console.log = (...args) => {
          logs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '));
        };

        const func = new Function(projectCode);
        func();
        
        console.log = originalLog;
        
        const result = logs.join('\n') || 'Code executed successfully!';
        setProjectOutput(result);
      } else if (currentProject.type === 'html') {
        setProjectOutput(projectCode);
      } else {
        setProjectOutput('Project execution for this language is coming soon!\nFor now, you can write and download your code.');
      }
    } catch (error) {
      setProjectOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const themeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-blue-100',
    card: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    border: darkMode ? 'border-gray-600' : 'border-gray-300',
    inputBg: darkMode ? 'bg-gray-700' : 'bg-white',
    outputBg: darkMode ? 'bg-black' : 'bg-gray-900'
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className={`text-3xl font-bold ${themeClasses.text}`}>
                🚀 Personal Projects
              </h1>
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                BETA
              </span>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <span>➕</span>
              <span>New Project</span>
            </button>
          </div>
          <p className={`${themeClasses.textSecondary} mt-2`}>
            Build your own projects! This workspace is completely separate from tutorials. 
            Create, code, and download your work. (No cloud sync in beta)
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Projects List */}
          <div className="col-span-3">
            <div className={`${themeClasses.card} rounded-xl shadow-lg p-4`}>
              <h2 className={`text-lg font-bold ${themeClasses.text} mb-4`}>My Projects</h2>
              
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📁</div>
                  <p className={`${themeClasses.textSecondary} text-sm`}>
                    No projects yet. Create your first project to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => switchProject(project)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                        currentProject?.id === project.id
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                          : `${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} border-transparent`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{LANGUAGES[project.type]?.icon}</span>
                          <span className={`font-medium ${themeClasses.text} text-sm`}>
                            {project.name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                      <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                        {new Date(project.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {currentProject ? (
              <div className="space-y-6">
                {/* Project Header */}
                <div className={`${themeClasses.card} rounded-xl shadow-lg p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{LANGUAGES[currentProject.type]?.icon}</span>
                      <div>
                        <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                          {currentProject.name}
                        </h2>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                          {LANGUAGES[currentProject.type]?.name} Project
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={saveCurrentProject}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        💾 Save
                      </button>
                      <button
                        onClick={downloadProject}
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                      >
                        ⬇️ Download
                      </button>
                      <button
                        onClick={runProjectCode}
                        disabled={isRunning}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                      >
                        {isRunning ? 'Running...' : '▶️ Run'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Code Editor */}
                <div className={`${themeClasses.card} rounded-xl shadow-lg overflow-hidden`}>
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-2 border-b ${themeClasses.border}`}>
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      Project Editor
                    </span>
                  </div>
                  <div className="h-96">
                    <Editor
                      height="100%"
                      defaultLanguage={LANGUAGES[currentProject.type]?.monacoLanguage}
                      value={projectCode}
                      onChange={(value) => setProjectCode(value || '')}
                      onMount={(editor) => { editorRef.current = editor; }}
                      theme={darkMode ? "vs-dark" : "light"}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>

                {/* Output */}
                <div className={`${themeClasses.card} rounded-xl shadow-lg`}>
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-2 border-b ${themeClasses.border}`}>
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {currentProject.type === 'html' ? 'Preview' : 'Output'}
                    </span>
                  </div>
                  <div className={`p-4 h-32 overflow-auto ${
                    currentProject.type === 'html' 
                      ? `${darkMode ? 'bg-gray-900' : 'bg-white'} ${themeClasses.text}` 
                      : `${themeClasses.outputBg} text-green-400 font-mono text-sm`
                  }`}>
                    {currentProject.type === 'html' ? (
                      <div dangerouslySetInnerHTML={{ __html: projectOutput || 'Click "Run" to preview your HTML...' }} />
                    ) : (
                      <pre className="whitespace-pre-wrap">{projectOutput || 'Click "Run" to see output...'}</pre>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${themeClasses.card} rounded-xl shadow-lg p-12 text-center`}>
                <div className="text-6xl mb-4">🚀</div>
                <h2 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>
                  Ready to Build Something Amazing?
                </h2>
                <p className={`${themeClasses.textSecondary} mb-6`}>
                  Create your first project and start coding! This is your personal workspace to experiment and build.
                </p>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Your First Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${themeClasses.card} rounded-xl p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-xl font-bold ${themeClasses.text} mb-4`}>Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className={`w-full px-3 py-2 border ${themeClasses.border} ${themeClasses.inputBg} ${themeClasses.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  Language
                </label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value)}
                  className={`w-full px-3 py-2 border ${themeClasses.border} ${themeClasses.inputBg} ${themeClasses.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {Object.entries(LANGUAGES).map(([key, lang]) => (
                    <option key={key} value={key}>
                      {lang.icon} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CodeLearningPlatform = () => {
  const { user, logout, loading } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState('javascript');
  const [currentTutorial, setCurrentTutorial] = useState(TUTORIALS.javascript[0]);
  const [code, setCode] = useState(TUTORIALS.javascript[0].starterCode);
  const [output, setOutput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [progress, setProgress] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  
  // Navigation state
  const [currentView, setCurrentView] = useState('learn'); // 'learn' or 'projects'
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  // Admin dashboard state
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const editorRef = useRef(null);
  const chatEndRef = useRef(null);
  const pyodideRef = useRef(null);

  // Load Pyodide from CDN when needed
  const loadPyodide = async () => {
    if (pyodideRef.current || pyodideLoading) return;
    
    setPyodideLoading(true);
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.0/full/pyodide.js';
      script.onload = async () => {
        try {
          pyodideRef.current = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.0/full/'
          });
          setPyodideReady(true);
          console.log("Pyodide loaded successfully!");
        } catch (error) {
          console.error("Failed to initialize Pyodide:", error);
        } finally {
          setPyodideLoading(false);
        }
      };
      script.onerror = () => {
        console.error("Failed to load Pyodide script");
        setPyodideLoading(false);
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error("Failed to load Pyodide:", error);
      setPyodideLoading(false);
    }
  };

  // Load user progress from backend
  const loadUserProgress = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const progressList = await response.json();
        const progressMap = {};
        progressList.forEach(p => {
          const key = `${p.language}_${p.tutorial_id}`;
          progressMap[key] = p;
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  // Initialize progress tracking and dark mode
  useEffect(() => {
    if (user) {
      loadUserProgress();
    } else {
      const savedProgress = localStorage.getItem('codingProgress');
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    }
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    const savedLanguage = localStorage.getItem('currentLanguage');
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
      const tutorials = TUTORIALS[savedLanguage];
      if (tutorials && tutorials.length > 0) {
        setCurrentTutorial(tutorials[0]);
        setCode(tutorials[0].starterCode);
      }
    }
  }, [user]);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('currentLanguage', currentLanguage);
  }, [currentLanguage]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Save progress to backend or localStorage
  const saveProgress = async (language, tutorialId, completed = false, codeSnapshot = null) => {
    const progressData = {
      language,
      tutorial_id: tutorialId,
      completed,
      code_snapshot: codeSnapshot
    };

    if (user) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(progressData)
        });

        if (response.ok) {
          const savedProgress = await response.json();
          const progressKey = `${language}_${tutorialId}`;
          setProgress(prev => ({
            ...prev,
            [progressKey]: savedProgress
          }));
        }
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    } else {
      const progressKey = `${language}_${tutorialId}`;
      const newProgress = {
        ...progress,
        [progressKey]: {
          completed,
          language,
          tutorial_id: tutorialId,
          last_accessed: new Date().toISOString()
        }
      };
      setProgress(newProgress);
      localStorage.setItem('codingProgress', JSON.stringify(newProgress));
    }
  };

  // Handle language change
  const changeLanguage = (newLanguage) => {
    setCurrentLanguage(newLanguage);
    const tutorials = TUTORIALS[newLanguage];
    if (tutorials && tutorials.length > 0) {
      const firstTutorial = tutorials[0];
      setCurrentTutorial(firstTutorial);
      setCode(firstTutorial.starterCode);
      setOutput('');
      setCurrentStep(0);
      setShowHints(false);
      saveProgress(newLanguage, firstTutorial.id);
      
      if (newLanguage === 'python' && !pyodideReady && !pyodideLoading) {
        loadPyodide();
      }
    }
  };

  // Handle tutorial selection
  const selectTutorial = (tutorial) => {
    setCurrentTutorial(tutorial);
    setCode(tutorial.starterCode);
    setOutput('');
    setCurrentStep(0);
    setShowHints(false);
    saveProgress(currentLanguage, tutorial.id);
  };

  // Execute code based on language
  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      const language = LANGUAGES[currentLanguage];
      
      if (language.execution === 'client') {
        // Client-side execution
        if (currentLanguage === 'javascript') {
          runJavaScript();
        } else if (currentLanguage === 'python') {
          await runPython();
        } else if (currentLanguage === 'html') {
          runHTML();
        }
      } else {
        // Server-side execution for compiled languages
        await runServerSide();
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Execute JavaScript code
  const runJavaScript = () => {
    try {
      const logs = [];
      const originalLog = console.log;
      
      console.log = (...args) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
      };

      const func = new Function(code);
      func();
      
      console.log = originalLog;
      
      const result = logs.join('\n') || 'Code executed successfully!';
      setOutput(result);
      
      if (logs.length > 0) {
        saveProgress(currentLanguage, currentTutorial.id, true, code);
      }
      
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // Execute Python code
  const runPython = async () => {
    if (!pyodideReady) {
      if (!pyodideLoading) {
        setOutput('Loading Python... This may take a moment on first use.');
        loadPyodide();
      } else {
        setOutput('Python is still loading... Please wait a moment and try again.');
      }
      return;
    }

    if (!pyodideRef.current) {
      setOutput('Python runtime not available. Please refresh the page and try again.');
      return;
    }

    try {
      pyodideRef.current.runPython(`
        import sys
        from io import StringIO
        sys.stdout = StringIO()
      `);
      
      pyodideRef.current.runPython(code);
      
      const stdout = pyodideRef.current.runPython('sys.stdout.getvalue()');
      
      const result = stdout || 'Code executed successfully!';
      setOutput(result);
      
      if (stdout) {
        saveProgress(currentLanguage, currentTutorial.id, true, code);
      }
      
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // Execute HTML/CSS code
  const runHTML = () => {
    try {
      const result = code || '<p>Write some HTML to see it rendered here!</p>';
      setOutput(result);
      
      if (code.trim()) {
        saveProgress(currentLanguage, currentTutorial.id, true, code);
      }
      
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // Execute server-side code
  const runServerSide = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          language: currentLanguage,
          code: code,
          tutorial_id: currentTutorial.id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.error) {
          setOutput(`Error: ${result.error}`);
        } else {
          setOutput(result.output || 'Code executed successfully!');
          if (result.output) {
            saveProgress(currentLanguage, currentTutorial.id, true, code);
          }
        }
      } else {
        setOutput('Error: Code execution service unavailable');
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // AI Chat functions
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    const userChatMessage = {
      id: Date.now(),
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userChatMessage]);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          context: `Language: ${LANGUAGES[currentLanguage].name}, Tutorial: ${currentTutorial.title} - Step ${currentStep + 1}`,
          current_code: code,
          error_message: output.startsWith('Error:') ? output : null,
          tutorial_id: currentTutorial.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiChatMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: data.response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiChatMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        message: "I'm sorry, I'm having trouble connecting right now. Please try asking your question again in a moment.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const quickAskAI = (question) => {
    setChatInput(question);
  };

  const clearOutput = () => setOutput('');
  const resetCode = () => {
    setCode(currentTutorial.starterCode);
    setOutput('');
  };

  const nextStep = () => {
    if (currentStep < currentTutorial.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get completed count for current language
  const getCompletedCount = (language) => {
    const tutorials = TUTORIALS[language] || [];
    return Object.values(progress).filter(p => 
      p.language === language && p.completed
    ).length;
  };

  const themeClasses = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100',
    header: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    card: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    border: darkMode ? 'border-gray-600' : 'border-gray-300',
    inputBg: darkMode ? 'bg-gray-700' : 'bg-white',
    tutorialActive: darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200',
    tutorialInactive: darkMode ? 'bg-gray-700 hover:bg-gray-600 border-transparent' : 'bg-gray-50 hover:bg-gray-100 border-transparent',
    outputBg: darkMode ? 'bg-black' : 'bg-gray-900'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Code Learning Scripter...</p>
        </div>
      </div>
    );
  }

  // Get current tutorials for the selected language
  const currentTutorials = TUTORIALS[currentLanguage] || [];

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      {/* Header */}
      <header className={`${themeClasses.header} shadow-sm border-b`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h1 className={`text-2xl font-bold ${themeClasses.text}`}>Code Learning Scripter</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Navigation Tabs */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentView('learn')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    currentView === 'learn'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                  }`}
                >
                  📚 Learn
                </button>
                <button
                  onClick={() => setCurrentView('projects')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1 ${
                    currentView === 'projects'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                  }`}
                >
                  <span>🚀 Projects</span>
                  <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">BETA</span>
                </button>
              </div>

              {/* Language Switcher - Only show on Learn tab */}
              {currentView === 'learn' && (
                <div className="flex items-center space-x-2 flex-wrap">
                  {Object.entries(LANGUAGES).map(([key, lang]) => (
                    <button
                      key={key}
                      onClick={() => changeLanguage(key)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all text-sm ${
                        currentLanguage === key
                          ? 'bg-blue-600 text-white shadow-lg'
                          : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                      }`}
                    >
                      <span>{lang.icon}</span>
                      <span className="font-medium hidden sm:inline">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Progress Counter - Only show on Learn tab */}
              {currentView === 'learn' && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {getCompletedCount(currentLanguage)} / {currentTutorials.length} Completed
                </div>
              )}
              
              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${themeClasses.text} hidden sm:inline`}>
                    Welcome, {user.username}!
                  </span>
                  {user.is_admin && (
                    <button
                      onClick={() => setShowAdminDashboard(true)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      Admin
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Sign In
                </button>
              )}
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400' 
                    : 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conditional Content */}
      {currentView === 'projects' ? (
        <ProjectsWorkspace darkMode={darkMode} />
      ) : (
        <>
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          
          {/* Left Sidebar - Tutorials */}
          <div className="col-span-12 lg:col-span-3">
            <div className={`${themeClasses.card} rounded-xl shadow-lg p-6 h-full`}>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">{LANGUAGES[currentLanguage].icon}</span>
                <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                  {LANGUAGES[currentLanguage].name} Tutorials
                </h2>
              </div>
              
              {currentTutorials.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`${themeClasses.textSecondary} mb-4`}>
                    Tutorials for {LANGUAGES[currentLanguage].name} are coming soon!
                  </p>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Try JavaScript, Python, or HTML/CSS for now.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentTutorials.map((tutorial) => {
                    const progressKey = `${currentLanguage}_${tutorial.id}`;
                    const isCompleted = progress[progressKey]?.completed;
                    
                    return (
                      <div
                        key={tutorial.id}
                        onClick={() => selectTutorial(tutorial)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                          currentTutorial.id === tutorial.id
                            ? themeClasses.tutorialActive
                            : themeClasses.tutorialInactive
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold ${themeClasses.text}`}>{tutorial.title}</h3>
                          {isCompleted && (
                            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>{tutorial.description}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${
                          tutorial.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                          tutorial.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tutorial.difficulty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Center - Main Content */}
          <div className="col-span-12 lg:col-span-6">
            {currentTutorials.length === 0 ? (
              <div className={`${themeClasses.card} rounded-xl shadow-lg p-8 text-center`}>
                <div className="text-6xl mb-4">{LANGUAGES[currentLanguage].icon}</div>
                <h2 className={`text-2xl font-bold ${themeClasses.text} mb-4`}>
                  {LANGUAGES[currentLanguage].name} Tutorials Coming Soon!
                </h2>
          <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
                  We're working hard to create amazing tutorials for {LANGUAGES[currentLanguage].name}.
                  In the meantime, try our other languages!
                </p>
                <div className="flex justify-center space-x-3">
                  {['javascript', 'python', 'html'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => changeLanguage(lang)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <span>{LANGUAGES[lang].icon}</span>
                      <span>{LANGUAGES[lang].name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Instructions Panel */}
                <div className={`${themeClasses.card} rounded-xl shadow-lg p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-bold ${themeClasses.text}`}>{currentTutorial.title}</h2>
                    <span className={`text-sm ${themeClasses.textSecondary}`}>
                      Step {currentStep + 1} of {currentTutorial.instructions.length}
                    </span>
                  </div>
                  
                  <div className={`${darkMode ? 'bg-blue-900/50' : 'bg-blue-50'} p-4 rounded-lg mb-4`}>
                    <p className={darkMode ? 'text-blue-100' : 'text-gray-700'}>{currentTutorial.instructions[currentStep]}</p>
                  </div>

                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className={`px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                        darkMode 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={currentStep === currentTutorial.instructions.length - 1}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>

                  {/* Quick AI Help Buttons */}
                  <div className="border-t border-gray-600 pt-4 mb-4">
                    <h4 className={`text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Quick Help:</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => quickAskAI("I'm stuck, can you help me?")}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          darkMode 
                            ? 'bg-purple-900 text-purple-200 hover:bg-purple-800' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        I'm stuck
                      </button>
                      <button
                        onClick={() => quickAskAI("Can you explain this concept?")}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          darkMode 
                            ? 'bg-purple-900 text-purple-200 hover:bg-purple-800' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        Explain this
                      </button>
                      <button
                        onClick={() => quickAskAI("What's wrong with my code?")}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          darkMode 
                            ? 'bg-purple-900 text-purple-200 hover:bg-purple-800' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        Debug code
                      </button>
                    </div>
                  </div>

                  {/* Hints Section */}
                  <div className="border-t border-gray-600 pt-4">
                    <button
                      onClick={() => setShowHints(!showHints)}
                      className="flex items-center text-purple-600 hover:text-purple-700 font-medium"
                    >
                      💡 {showHints ? 'Hide' : 'Show'} Hints
                    </button>
                    {showHints && (
                      <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
                        <ul className="space-y-1">
                          {currentTutorial.hints.map((hint, index) => (
                            <li key={index} className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>• {hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Code Editor */}
                <div className={`${themeClasses.card} rounded-xl shadow-lg overflow-hidden`}>
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-2 border-b ${themeClasses.border} flex items-center justify-between`}>
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {LANGUAGES[currentLanguage].name} Editor
                      {LANGUAGES[currentLanguage].execution === 'server' && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Cloud ☁️
                        </span>
                      )}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={resetCode}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          darkMode 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        Reset
                      </button>
                      <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isRunning ? 'Running...' : '▶ Run Code'}
                      </button>
                    </div>
                  </div>
                  <div className="h-64">
                    <Editor
                      height="100%"
                      defaultLanguage={LANGUAGES[currentLanguage].monacoLanguage}
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      onMount={(editor) => { editorRef.current = editor; }}
                      theme={darkMode ? "vs-dark" : "light"}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>

                {/* Output Panel */}
                <div className={`${themeClasses.card} rounded-xl shadow-lg`}>
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-2 border-b ${themeClasses.border} flex items-center justify-between`}>
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {currentLanguage === 'html' ? 'Live Preview' : 'Output'}
                    </span>
                    <button
                      onClick={clearOutput}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                    >
                      Clear
                    </button>
                  </div>
                  <div className={`p-4 h-32 overflow-auto ${
                    currentLanguage === 'html' 
                      ? `${darkMode ? 'bg-gray-900' : 'bg-white'} ${themeClasses.text}` 
                      : `${themeClasses.outputBg} text-green-400 font-mono text-sm`
                  }`}>
                    {currentLanguage === 'html' ? (
                      <div dangerouslySetInnerHTML={{ __html: output || 'Click "Run Code" to see your HTML rendered here...' }} />
                    ) : (
                      <pre className="whitespace-pre-wrap">{output || 'Click "Run Code" to see output here...'}</pre>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - AI Chat */}
          <div className="col-span-12 lg:col-span-3">
            <div className={`${themeClasses.card} rounded-xl shadow-lg h-full flex flex-col`}>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 rounded-t-xl">
                <h3 className="text-white font-semibold">🤖 AI Tutor</h3>
                <p className="text-purple-100 text-xs">
                  Learning {LANGUAGES[currentLanguage].name}
                </p>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto" style={{maxHeight: 'calc(100vh - 300px)'}}>
                {chatMessages.length === 0 ? (
                  <div className="text-center mt-8">
                    <div className="text-4xl mb-4">🤖</div>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Hi! I'm your AI coding tutor.</p>
                    <p className={`text-sm ${themeClasses.textSecondary}`}>Ask me anything about {LANGUAGES[currentLanguage].name}!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            msg.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : `${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className={`px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                          <div className="flex items-center space-x-1">
                            <div className="animate-bounce">●</div>
                            <div className="animate-bounce" style={{animationDelay: '0.1s'}}>●</div>
                            <div className="animate-bounce" style={{animationDelay: '0.2s'}}>●</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className={`border-t ${themeClasses.border} p-4`}>
                <div className="flex space-x-2">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder={`Ask me about ${LANGUAGES[currentLanguage].name}...`}
                    className={`flex-1 px-3 py-2 border ${themeClasses.border} ${themeClasses.inputBg} ${themeClasses.text} rounded-lg resize-none h-10 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    rows="1"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
      />

      {/* Admin Dashboard */}
      {showAdminDashboard && (
        <AdminDashboard
          onClose={() => setShowAdminDashboard(false)}
          darkMode={darkMode}
        />
      )}
        </>
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CodeLearningPlatform />
    </AuthProvider>
  );
};

export default App;