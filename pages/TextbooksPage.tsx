import React, { useState, useMemo } from 'react';
import { BOOKS_DATA } from '../constants';

const TextbooksPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBooks = useMemo(() => {
    if (!searchTerm) return BOOKS_DATA;
    return BOOKS_DATA.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-primary-500 dark:text-primary-400">الكتب المدرسية</h1>
        <p className="text-secondary mt-2">تصفح وحمل الكتب المدرسية لجميع المراحل</p>
      </header>

      <div className="mb-6">
        <input
          type="text"
          placeholder="ابحث عن كتاب، صف، أو مادة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 bg-surface border border-weak rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
        />
      </div>

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredBooks.map((book) => (
            <div key={book.id} className="bg-surface rounded-lg shadow-lg overflow-hidden flex flex-col group border border-weak">
              <img src={book.coverUrl} alt={book.title} className="w-full h-40 object-cover" />
              <div className="p-3 flex flex-col flex-grow">
                <h3 className="font-bold text-sm">{book.title}</h3>
                <p className="text-xs text-secondary mt-1">{book.grade}</p>
                 <a
                    href={book.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto w-full text-center bg-primary-600 text-white py-2 px-3 text-xs font-bold rounded-md hover:bg-primary-500 transition-transform duration-200 group-hover:scale-105"
                  >
                    تحميل
                  </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
            <p className="text-secondary">لم يتم العثور على كتب تطابق بحثك.</p>
        </div>
      )}
    </div>
  );
};

export default TextbooksPage;