import { departure, arrival, calendar, person } from "../assets/icons";
import { toast } from "react-toastify";

import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { suggestions } from "../data/constant";

const AutoSuggest = (initialValue) => {
  const [input, setInput] = useState(initialValue ? { code: 'HAN', name: 'Hà Nội', fullName: 'Sân bay Nội Bài' } : null);
  const [searchText, setSearchText] = useState(initialValue ? 'Hà Nội' : '');
  const [matchingSuggestions, setMatchingSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset search text to selected input when closing dropdown
        if (input) {
          setSearchText(input.name);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [input]);

  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    setSearchText(inputValue);
    setInput(null);
    showSuggestions(inputValue);
  };

  const showSuggestions = (inputValue) => {
    if (!inputValue) {
      setMatchingSuggestions(suggestions);
    } else {
      const filteredSuggestions = suggestions.filter((suggestion) =>
        suggestion.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        suggestion.code.toLowerCase().includes(inputValue.toLowerCase()) ||
        suggestion.fullName.toLowerCase().includes(inputValue.toLowerCase())
      );
      setMatchingSuggestions(filteredSuggestions);
    }
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setSearchText(suggestion.name);
    setIsOpen(false);
  };

  return {
    input,
    searchText,
    matchingSuggestions,
    isOpen,
    setInput,
    setSearchText,
    setIsOpen,
    handleInputChange,
    handleSuggestionClick,
    showSuggestions,
    dropdownRef
  };
}

const Hero = () => {
  const navigate = useNavigate();
  const [openDate, setOpenDate] = useState(false);
  const [date, setDate] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const [openOptions, setOpenOptions] = useState(false);
  const [options, setOptions] = useState({
    adult: 1,
    minor: 0,
  });

  const handleOptions = (name, operation) => {
    setOptions((prev) => {
      return {
        ...prev,
        [name]: operation === "i" ? options[name] + 1 : options[name] - 1,
      };
    });
  };

  const departureSuggest = AutoSuggest('Hà Nội');
  const arrivalSuggest = AutoSuggest('');
  const datePickerRef = useRef(null);
  const optionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setOpenDate(false);
      }
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setOpenOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSearch = () => {
    if (!departureSuggest.input || !arrivalSuggest.input) {
      toast.error('Vui lòng chọn điểm đi và điểm đến');
      return;
    }

    if (departureSuggest.input.code === arrivalSuggest.input?.code) {
      toast.error('Điểm đi và điểm đến không được trùng nhau');
      return;
    }

    navigate(`/explore?from=${departureSuggest.input.name}&to=${arrivalSuggest.input.name}&startDate=${format(date[0].startDate, "yyyy-MM-dd")}&endDate=${format(date[0].endDate, "yyyy-MM-dd")}&adult=${options.adult}&minor=${options.minor}`);
  };

  return (
    <>
      <header className="flex flex-col items-center relative w-full h-[529px] px-7 py-4">
        <div className="flex justify-center items-center">
          <h1 className="font-extrabold text-5xl sm:text-7xl md:text-8xl text-center leading-[55px] sm:leading-[70px] md:leading-[90px] text-gradient">
            It's more than <br /> just a trip
          </h1>
        </div>

        <div className="flex flex-col w-full max-w-[1024px] mt-20 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative" ref={departureSuggest.dropdownRef}>
                <label className="block text-[#1A1D1F] font-medium text-sm mb-2">Điểm đi</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Chọn điểm đi"
                    value={departureSuggest.searchText}
                    onChange={departureSuggest.handleInputChange}
                    onFocus={() => departureSuggest.showSuggestions(departureSuggest.searchText)}
                    className="w-full p-3 pl-10 border-2 border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#605DEC] focus:ring-2 focus:ring-[#605DEC]/20 transition-all"
                  />
                  {departureSuggest.input && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#E8ECEF] px-2 py-1 rounded text-sm font-medium">
                      {departureSuggest.input.code}
                    </div>
                  )}
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.16669 9.99999H15.8334M15.8334 9.99999L10 4.16666M15.8334 9.99999L10 15.8333" stroke="#6F767E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {departureSuggest.isOpen && departureSuggest.matchingSuggestions.length > 0 && (
                  <ul className="absolute w-full bg-white mt-1 border-2 border-[#E8ECEF] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {departureSuggest.matchingSuggestions.map((suggestion) => (
                      <li
                        key={suggestion.code}
                        onClick={() => departureSuggest.handleSuggestionClick(suggestion)}
                        className="p-3 hover:bg-[#F6F6FE] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{suggestion.name}</div>
                            <div className="text-sm text-gray-500">{suggestion.fullName}</div>
                          </div>
                          <div className="bg-[#E8ECEF] px-2 py-1 rounded text-sm font-medium">
                            {suggestion.code}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative" ref={arrivalSuggest.dropdownRef}>
                <label className="block text-[#1A1D1F] font-medium text-sm mb-2">Điểm đến</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Chọn điểm đến"
                    value={arrivalSuggest.searchText}
                    onChange={arrivalSuggest.handleInputChange}
                    onFocus={() => arrivalSuggest.showSuggestions(arrivalSuggest.searchText)}
                    className="w-full p-3 pl-10 border-2 border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#605DEC] focus:ring-2 focus:ring-[#605DEC]/20 transition-all"
                  />
                  {arrivalSuggest.input && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#E8ECEF] px-2 py-1 rounded text-sm font-medium">
                      {arrivalSuggest.input.code}
                    </div>
                  )}
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.16669 9.99999H15.8334M15.8334 9.99999L10 4.16666M15.8334 9.99999L10 15.8333" stroke="#6F767E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {arrivalSuggest.isOpen && arrivalSuggest.matchingSuggestions.length > 0 && (
                  <ul className="absolute w-full bg-white mt-1 border-2 border-[#E8ECEF] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {arrivalSuggest.matchingSuggestions.map((suggestion) => (
                      <li
                        key={suggestion.code}
                        onClick={() => arrivalSuggest.handleSuggestionClick(suggestion)}
                        className="p-3 hover:bg-[#F6F6FE] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{suggestion.name}</div>
                            <div className="text-sm text-gray-500">{suggestion.fullName}</div>
                          </div>
                          <div className="bg-[#E8ECEF] px-2 py-1 rounded text-sm font-medium">
                            {suggestion.code}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative" ref={datePickerRef}>
                <label className="block text-[#1A1D1F] font-medium text-sm mb-2">Ngày đi - Ngày về</label>
                <div className="relative">
                  <input
                    type="text"
                    value={`${format(date[0].startDate, "dd/MM/yyyy")} - ${format(date[0].endDate, "dd/MM/yyyy")}`}
                    onClick={() => setOpenDate(!openDate)}
                    className="w-full p-3 pl-10 border-2 border-[#E8ECEF] rounded-lg focus:outline-none focus:border-[#605DEC] focus:ring-2 focus:ring-[#605DEC]/20 transition-all cursor-pointer"
                    readOnly
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.66667 1.66667V4.16667M13.3333 1.66667V4.16667M2.91667 7.575H17.0833M17.5 7.08333V14.1667C17.5 16.6667 16.25 18.3333 13.3333 18.3333H6.66667C3.75 18.3333 2.5 16.6667 2.5 14.1667V7.08333C2.5 4.58333 3.75 2.91667 6.66667 2.91667H13.3333C16.25 2.91667 17.5 4.58333 17.5 7.08333Z" stroke="#6F767E" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {openDate && (
                    <div className="absolute top-full left-0 z-50 mt-2">
                      <DateRange
                        editableDateInputs={true}
                        onChange={(item) => setDate([item.selection])}
                        moveRangeOnFirstSelection={false}
                        ranges={date}
                        className="border-2 border-[#E8ECEF] rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="relative" ref={optionsRef}>
                <label className="block text-[#1A1D1F] font-medium text-sm mb-2">Hành khách</label>
                <div
                  className="relative w-full p-3 pl-10 border-2 border-[#E8ECEF] rounded-lg cursor-pointer focus:outline-none focus:border-[#605DEC] focus:ring-2 focus:ring-[#605DEC]/20 transition-all"
                  onClick={() => setOpenOptions(!openOptions)}
                >
                  <span className="text-[#1A1D1F]">
                    {options.adult} người lớn{options.minor > 0 ? `, ${options.minor} trẻ em` : ''}
                  </span>
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 10C12.3012 10 14.1667 8.13452 14.1667 5.83333C14.1667 3.53214 12.3012 1.66667 10 1.66667C7.69881 1.66667 5.83334 3.53214 5.83334 5.83333C5.83334 8.13452 7.69881 10 10 10Z" stroke="#6F767E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.1583 18.3333C17.1583 15.1083 13.95 12.5 10 12.5C6.05001 12.5 2.84167 15.1083 2.84167 18.3333" stroke="#6F767E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {openOptions && (
                  <div className="absolute top-full left-0 w-64 bg-white rounded-lg shadow-lg z-50 mt-2 border-2 border-[#E8ECEF]">
                    <div className="p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#1A1D1F] font-medium">Người lớn</span>
                        <div className="flex items-center gap-4">
                          <button
                            className="w-8 h-8 rounded-lg border-2 border-[#605DEC] text-[#605DEC] disabled:opacity-50 disabled:border-[#E8ECEF] disabled:text-[#6F767E] transition-colors"
                            onClick={() => handleOptions("adult", "d")}
                            disabled={options.adult <= 1}
                          >
                            -
                          </button>
                          <span className="text-[#1A1D1F] w-4 text-center">{options.adult}</span>
                          <button
                            className="w-8 h-8 rounded-lg border-2 border-[#605DEC] text-[#605DEC] hover:bg-[#F6F6FE] transition-colors"
                            onClick={() => handleOptions("adult", "i")}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#1A1D1F] font-medium">Trẻ em</span>
                        <div className="flex items-center gap-4">
                          <button
                            className="w-8 h-8 rounded-lg border-2 border-[#605DEC] text-[#605DEC] disabled:opacity-50 disabled:border-[#E8ECEF] disabled:text-[#6F767E] transition-colors"
                            onClick={() => handleOptions("minor", "d")}
                            disabled={options.minor <= 0}
                          >
                            -
                          </button>
                          <span className="text-[#1A1D1F] w-4 text-center">{options.minor}</span>
                          <button
                            className="w-8 h-8 rounded-lg border-2 border-[#605DEC] text-[#605DEC] hover:bg-[#F6F6FE] transition-colors"
                            onClick={() => handleOptions("minor", "i")}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSearch}
                className="bg-[#605DEC] text-white px-6 py-3 rounded-lg hover:bg-[#4B48BF] transition-colors flex items-center gap-2 shadow-lg"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 17.5L14.1667 14.1667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Tìm chuyến bay
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Hero;

//git push -u origin main
