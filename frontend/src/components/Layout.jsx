import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="page">
            <nav className="navbar">
                <div className="container navbar-content">
                    <span className="navbar-brand">DevFlow</span>

                    <ul className="navbar-nav">
                        <li>
                            <NavLink to="/" end>Dashboard</NavLink>
                        </li>
                        <li>
                            <NavLink to="/projetos">Projetos</NavLink>
                        </li>
                        <li>
                            <NavLink to="/execucoes">Execuções</NavLink>
                        </li>
                        <li>
                            <NavLink to="/plugins">Plugin Builder</NavLink>
                        </li>
                    </ul>

                    <div className="flex gap-md">
                        <span className="text-muted text-small">
                            {user?.nome}
                        </span>
                        <button className="btn btn-secondary" onClick={handleLogout}>
                            Sair
                        </button>
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default Layout;
