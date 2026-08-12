import { useState, useEffect, useCallback } from 'react';
import { FaUser, FaEnvelope, FaIdCard, FaKey, FaPhone, FaCalendar, FaVenusMars, FaMapMarkerAlt, FaCamera, FaSpinner, FaPalette } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { getUserByEmail, updateUser, changePassword, uploadUserAvatar, getProfileBasicInfoHtml } from '../services/api';
import { useNavigate } from 'react-router-dom';
import useProtectedUploadHtml from '../hooks/useProtectedUploadHtml';
import useProtectedUploadUrl from '../hooks/useProtectedUploadUrl';

const ProfileSection = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const InputField = ({
  icon: Icon,
  label,
  type = "text",
  value,
  onChange,
  disabled = false,
  error = "",
  as = "input",
  options = [],
  placeholder = ""
}) => {
  const commonClasses = `block w-full pl-10 pr-3 py-2 sm:text-sm rounded-lg
    ${disabled 
      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
      : 'bg-white focus:ring-2 focus:ring-[#605DEC] focus:border-[#605DEC]'
    }
    ${error ? 'border-red-300' : 'border-gray-300'}
    transition-colors duration-200
  `;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        {as === "select" ? (
          <select
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            className={commonClasses}
          >
            <option value="">{placeholder || `Chọn ${label.toLowerCase()}`}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : as === "textarea" ? (
          <textarea
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            className={`${commonClasses} resize-none h-20`}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={onChange}
            disabled={disabled}
            className={commonClasses}
          />
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};

const DEFAULT_PROFILE_THEME = 'light_mode';
const TEMPLATE_SUFFIX = '.ftl';
const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' }
];
const PROFILE_THEME_OPTIONS = [
  { value: 'light_mode', label: 'Light mode' },
  { value: 'dark_mode', label: 'Dark mode' }
];
const PROFILE_THEME_VALUES = PROFILE_THEME_OPTIONS.map(option => option.value);

const normalizeProfileTheme = (value) => {
  return PROFILE_THEME_VALUES.includes(value) ? value : DEFAULT_PROFILE_THEME;
};

const stripTemplateSuffix = (value) => {
  const themeName = value || `${DEFAULT_PROFILE_THEME}${TEMPLATE_SUFFIX}`;
  const withoutSuffix = themeName.endsWith(TEMPLATE_SUFFIX)
    ? themeName.slice(0, -TEMPLATE_SUFFIX.length)
    : themeName;
  return normalizeProfileTheme(withoutSuffix);
};

const withTemplateSuffix = (value) => {
  const themeName = normalizeProfileTheme((value || DEFAULT_PROFILE_THEME).trim());
  return `${themeName}${TEMPLATE_SUFFIX}`;
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [basicInfoHtml, setBasicInfoHtml] = useState('');
  const [basicInfoLoading, setBasicInfoLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatarUrl: '',
    idNumber: '',
    birthday: '',
    phoneNum: '',
    gender: '',
    address: '',
    profileTheme: DEFAULT_PROFILE_THEME,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const loadBasicInfoHtml = useCallback(async () => {
    try {
      setBasicInfoLoading(true);
      const response = await getProfileBasicInfoHtml();
      setBasicInfoHtml(response.data || '');
    } catch (error) {
      console.error('Error fetching SSR basic info:', error);
      setBasicInfoHtml('');
    } finally {
      setBasicInfoLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.email) {
          const [response] = await Promise.all([
            getUserByEmail(user.email),
            loadBasicInfoHtml()
          ]);
          const userData = response.data;
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            avatarUrl: userData.avatarUrl || '',
            idNumber: userData.idNumber || '',
            birthday: userData.birthday ? new Date(userData.birthday).toISOString().split('T')[0] : '',
            phoneNum: userData.phoneNum || '',
            gender: userData.gender || '',
            address: userData.address || '',
            profileTheme: stripTemplateSuffix(userData.profileTheme),
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Không thể tải thông tin người dùng');
      }
    };

    fetchUserData();
  }, [user, loadBasicInfoHtml]);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (isChangingPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
      }
      if (!formData.newPassword) {
        newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    }

    if (isEditing) {
      if (!formData.phoneNum) {
        newErrors.phoneNum = 'Vui lòng nhập số điện thoại';
      }
      if (!formData.birthday) {
        newErrors.birthday = 'Vui lòng chọn ngày sinh';
      }
      if (!formData.gender) {
        newErrors.gender = 'Vui lòng chọn giới tính';
      }
      if (!formData.address) {
        newErrors.address = 'Vui lòng nhập địa chỉ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) {
      return;
    }
    if (!user?.id) {
      toast.error('Không tìm thấy người dùng để cập nhật ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh đại diện không được vượt quá 5MB');
      return;
    }

    try {
      setAvatarUploading(true);
      const response = await uploadUserAvatar(user.id, file);
      const updatedUser = response.data;
      setUser(updatedUser);
      setFormData(prev => ({
        ...prev,
        avatarUrl: updatedUser.avatarUrl || ''
      }));
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      const errorMessage = error.response?.data || 'Không thể cập nhật ảnh đại diện';
      toast.error(errorMessage);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isChangingPassword) {
        try {
          await changePassword({
            email: user.email,
            oldPassword: formData.currentPassword,
            newPassword: formData.newPassword
          });
          toast.success('Đổi mật khẩu thành công!');
          setIsChangingPassword(false);
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        } catch (error) {
          console.error('Password change error:', error);
          let errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu';
          
          if (error.response?.status === 400) {
            errorMessage = 'Mật khẩu hiện tại không đúng';
          } else if (error.response?.status === 401 || error.response?.status === 403) {
            errorMessage = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
            localStorage.removeItem('token');
            navigate('/login');
          } else if (error.response?.data) {
            errorMessage = error.response.data;
          }
          
          toast.error(errorMessage);
          return;
        }
      } else {
        const updateData = {
          id: user.id,
          email: user.email,
          name: formData.name,
          avatarUrl: formData.avatarUrl || user.avatarUrl || '',
          idNumber: formData.idNumber,
          birthday: formData.birthday,
          phoneNum: formData.phoneNum,
          gender: formData.gender,
          address: formData.address,
          profileTheme: withTemplateSuffix(formData.profileTheme),
          role: user.role,
          createBy: user.createBy,
          createDate: user.createDate,
          updateBy: user.email,
          updateDate: new Date().toISOString(),
          forgotten: user.forgotten || false,
          deleted: user.deleted || false
        };
        
        const response = await updateUser(updateData);
        if (response.data === "Edited") {
          const updatedUserResponse = await getUserByEmail(user.email);
          setUser(updatedUserResponse.data);
          await loadBasicInfoHtml();
          toast.success('Cập nhật thông tin thành công!');
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data || 'Có lỗi xảy ra. Vui lòng thử lại!';
      toast.error(errorMessage);
    }
  };

  const rawAvatarSrc = formData.avatarUrl || user?.avatarUrl || '';
  const avatarSrc = useProtectedUploadUrl(rawAvatarSrc);
  const protectedBasicInfoHtml = useProtectedUploadHtml(basicInfoHtml);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={formData.name || 'Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FaUser className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                      <FaSpinner className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
                  <p className="mt-1 truncate text-sm text-gray-500">{formData.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200
                  ${avatarUploading
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {avatarUploading ? (
                    <FaSpinner className="h-4 w-4 animate-spin" />
                  ) : (
                    <FaCamera className="h-4 w-4" />
                  )}
                  Đổi ảnh
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setIsChangingPassword(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200
                    ${isEditing
                      ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      : 'bg-[#605DEC] text-white hover:bg-[#4B48BF]'
                    }`}
                >
                  {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(!isChangingPassword);
                    setIsEditing(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200
                    ${isChangingPassword
                      ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      : 'bg-[#605DEC] text-white hover:bg-[#4B48BF]'
                    }`}
                >
                  {isChangingPassword ? 'Hủy' : 'Đổi mật khẩu'}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            {isEditing ? (
              <ProfileSection title="Thông tin cơ bản">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    icon={FaUser}
                    label="Họ và tên"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    disabled={!isEditing}
                    error={errors.name}
                  />
                  <InputField
                    icon={FaEnvelope}
                    label="Email"
                    type="email"
                    value={formData.email}
                    disabled={true}
                  />
                  <InputField
                    icon={FaIdCard}
                    label="Mã định danh"
                    value={formData.idNumber}
                    disabled={true}
                  />
                  <InputField
                    icon={FaPhone}
                    label="Số điện thoại"
                    value={formData.phoneNum}
                    onChange={handleInputChange('phoneNum')}
                    disabled={!isEditing}
                    error={errors.phoneNum}
                  />
                  <InputField
                    icon={FaCalendar}
                    label="Ngày sinh"
                    type="date"
                    value={formData.birthday}
                    onChange={handleInputChange('birthday')}
                    disabled={!isEditing}
                    error={errors.birthday}
                  />
                  <InputField
                    icon={FaVenusMars}
                    label="Giới tính"
                    value={formData.gender}
                    onChange={handleInputChange('gender')}
                    disabled={!isEditing}
                    error={errors.gender}
                    as="select"
                    options={GENDER_OPTIONS}
                    placeholder="Chọn giới tính"
                  />
                  <InputField
                    icon={FaPalette}
                    label="Theme"
                    value={formData.profileTheme}
                    onChange={handleInputChange('profileTheme')}
                    disabled={!isEditing}
                    as="select"
                    options={PROFILE_THEME_OPTIONS}
                    placeholder="Chọn theme"
                  />
                  <div className="md:col-span-2">
                    <InputField
                      icon={FaMapMarkerAlt}
                      label="Địa chỉ"
                      value={formData.address}
                      onChange={handleInputChange('address')}
                      disabled={!isEditing}
                      error={errors.address}
                      as="textarea"
                    />
                  </div>
                </div>
              </ProfileSection>
            ) : basicInfoLoading ? (
              <ProfileSection title="Thông tin cơ bản">
                <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
              </ProfileSection>
            ) : basicInfoHtml ? (
              protectedBasicInfoHtml ? (
                <div dangerouslySetInnerHTML={{ __html: protectedBasicInfoHtml }} />
              ) : (
                <ProfileSection title="Thông tin cơ bản">
                  <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
                </ProfileSection>
              )
            ) : (
              <ProfileSection title="Thông tin cơ bản">
                <p className="text-sm text-gray-500">Không thể tải thông tin cơ bản.</p>
              </ProfileSection>
            )}

            {/* Password Change Section */}
            {isChangingPassword && (
              <ProfileSection title="Đổi mật khẩu">
                <div className="space-y-6">
                  <InputField
                    icon={FaKey}
                    label="Mật khẩu hiện tại"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange('currentPassword')}
                    error={errors.currentPassword}
                  />
                  <InputField
                    icon={FaKey}
                    label="Mật khẩu mới"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange('newPassword')}
                    error={errors.newPassword}
                  />
                  <InputField
                    icon={FaKey}
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    error={errors.confirmPassword}
                  />
                </div>
              </ProfileSection>
            )}

            {/* Submit Button */}
            {(isEditing || isChangingPassword) && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#605DEC] text-white rounded-lg hover:bg-[#4B48BF] transition-colors duration-200"
                >
                  {isChangingPassword ? 'Đổi mật khẩu' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
