/* eslint-disable react/prop-types */

const PlacesCard = ({ image, title, name, desc }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-4 right-4 bg-[#54cdb7] text-white px-3 py-1 rounded-full text-sm font-medium">
          Địa điểm
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-[#6E7491]">
            {title} <span className="text-[#54cdb7]">{name}</span>
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3">{desc}</p>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-[#54cdb7] font-medium">Xem chi tiết</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#54cdb7]"></div>
            <span className="text-sm text-gray-500">Địa điểm nổi bật</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacesCard;