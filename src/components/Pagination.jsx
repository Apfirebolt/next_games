'use client';

import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePageClick = (page) => {
        if (page !== currentPage) {
            onPageChange(page);
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const startPages = [1, 2, 3, 4];
        const endPages = [totalPages - 3, totalPages - 2, totalPages - 1, totalPages];

        if (totalPages <= 8) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            startPages.forEach(page => {
                if (page <= totalPages) {
                    pages.push(page);
                }
            });

            if (currentPage > 4 && currentPage < totalPages - 3) {
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
            } else {
                pages.push('...');
            }

            endPages.forEach(page => {
                if (page > 4) {
                    pages.push(page);
                }
            });
        }

        return pages.map((page, index) => (
            <button
                key={index}
                onClick={() => typeof page === 'number' && handlePageClick(page)}
                className={`px-4 py-2 ${page === currentPage ? 'bg-tan text-onPrimary' : 'bg-carafe text-onSecondary'} rounded hover:bg-hoverSecondary`}
                disabled={typeof page !== 'number'}
            >
                {page}
            </button>
        ));
    };

    return (
        <div className="flex flex-col sm:flex-row justify-center text-neutral-100 items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <button
                onClick={handlePrevious}
                className="px-4 py-2 bg-carafe text-onSecondary rounded hover:bg-hoverSecondary"
                disabled={currentPage === 1}
            >
                Previous
            </button>
            <div className="flex space-x-2">
                {renderPageNumbers()}
            </div>
            <button
                onClick={handleNext}
                className="px-4 py-2 bg-carafe text-onSecondary rounded hover:bg-hoverSecondary"
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;