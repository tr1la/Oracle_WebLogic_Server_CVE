const AdminPageHeader = ({ title, description, actions, kicker = 'KTVAirline Admin' }) => {
  return (
    <div className="admin-page-header">
      <div>
        <p className="admin-page-kicker">{kicker}</p>
        <h1 className="admin-page-title">{title}</h1>
        {description && (
          <p className="admin-page-description">{description}</p>
        )}
      </div>

      {actions && (
        <div className="admin-page-actions">
          {actions}
        </div>
      )}
    </div>
  );
};

export default AdminPageHeader;
