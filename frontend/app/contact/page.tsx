'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

type ContactForm = {
  name: string;
  phone: string;
  email: string;
  message: string;
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>();

  const onSubmit = async (data: ContactForm) => {
    console.log('Contact form data:', data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Thank you for your interest!
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            We will contact you shortly about getting connected with M_Online.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto md:max-w-none md:grid md:grid-cols-2 md:gap-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Get Connected
            </h2>
            <div className="mt-3">
              <p className="text-lg text-gray-500">
                Fill out the form and our team will get in touch with you about setting up your connection.
              </p>
            </div>
          </div>

          <div className="mt-8 md:mt-0">
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    className="
                      w-full px-4 py-3 shadow-sm border-gray-300 rounded-md
                      focus:ring-indigo-500 focus:border-indigo-500
                      bg-white text-gray-900 placeholder-gray-500
                      block !text-gray-900
                    "
                    placeholder="Enter your full name"
                    style={{ color: '#111827' }}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    {...register('phone', { required: 'Phone number is required' })}
                    className="
                      w-full px-4 py-3 shadow-sm border-gray-300 rounded-md
                      focus:ring-indigo-500 focus:border-indigo-500
                      bg-white text-gray-900 placeholder-gray-500
                      block !text-gray-900
                    "
                    placeholder="Enter your phone number"
                    style={{ color: '#111827' }}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className="
                      w-full px-4 py-3 shadow-sm border-gray-300 rounded-md
                      focus:ring-indigo-500 focus:border-indigo-500
                      bg-white text-gray-900 placeholder-gray-500
                      block !text-gray-900
                    "
                    placeholder="Enter your email"
                    style={{ color: '#111827' }}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <div className="mt-1">
                  <textarea
                    {...register('message', { required: 'Message is required' })}
                    rows={4}
                    className="
                      w-full px-4 py-3 shadow-sm border-gray-300 rounded-md
                      focus:ring-indigo-500 focus:border-indigo-500
                      bg-white text-gray-900 placeholder-gray-500
                      block !text-gray-900
                    "
                    placeholder="Tell us more about your needs"
                    style={{ color: '#111827' }}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="
                    w-full inline-flex items-center justify-center
                    px-6 py-3 border border-transparent rounded-md shadow-sm
                    text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  "
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}