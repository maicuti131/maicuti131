import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import axios from 'axios';
import {
  Home,
  Login,
  Register,
  VideoDetail,
  UploadVideo,
  LiveStream,
  UserProfile,
  AdminDashboard,
  SearchResults
} from './pages';
import { Navbar, Footer } from './components';

axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      getUserData();
    }
    fetchVideos();
  }, []);

  const getUserData = async () => {
    try {
      const res = await axios.get('/auth');
      setUser(res.data.user);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('token');
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await axios.get('/videos');
      setVideos(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('/login', { email, password });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response.data.msg };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post('/register', { username, email, password });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response.data.msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar user={user} logout={logout} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Switch>
            <Route exact path="/">
              <Home videos={videos} loading={loading} />
            </Route>
            <Route path="/login">
              <Login login={login} />
            </Route>
            <Route path="/register">
              <Register register={register} />
            </Route>
            <Route path="/video/:id">
              <VideoDetail user={user} />
            </Route>
            <Route path="/upload">
              <UploadVideo user={user} />
            </Route>
            <Route path="/live">
              <LiveStream user={user} />
            </Route>
            <Route path="/profile/:id">
              <UserProfile user={user} />
            </Route>
            <Route path="/admin">
              <AdminDashboard user={user} />
            </Route>
            <Route path="/search">
              <SearchResults />
            </Route>
          </Switch>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
