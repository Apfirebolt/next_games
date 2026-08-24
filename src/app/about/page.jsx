"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

const techStack = [
  { name: "Next.js", role: "Framework" },
  { name: "Tailwind CSS v4", role: "Styling" },
  { name: "Redux Toolkit", role: "State Management" },
  { name: "Headless UI", role: "Accessible Components" },
  { name: "Heroicons", role: "Iconography" },
];

export default function About() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="rounded-full bg-brown/20 px-3.5 py-1 text-xs font-semibold tracking-wider text-tan uppercase border border-brown/30">
            About Next Games
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Built with Modern Web Tech
          </h1>

          <p className="mt-4 text-base text-tan leading-relaxed max-w-lg">
            A performant gaming portal crafted with the latest front-end standards, optimized for speed and fluidity.
          </p>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brown px-5 py-2.5 text-sm font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tan"
          >
            <span>View Technology Stack</span>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Headless UI Modal */}
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
            {/* Backdrop */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            </Transition.Child>

            {/* Modal Container */}
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border border-brown/40 bg-carafe p-6 text-left align-middle shadow-2xl transition-all">
                    <div className="flex items-center justify-between pb-3 border-b border-brown/20">
                      <Dialog.Title as="h3" className="text-lg font-bold text-white">
                        Under the Hood
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg p-1 text-tan hover:bg-brown/20 hover:text-white transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-tan leading-relaxed">
                        This application is powered by a robust modular architecture designed for high scalability:
                      </p>

                      {/* Tech Chips */}
                      <div className="mt-4 space-y-2">
                        {techStack.map((tech) => (
                          <div
                            key={tech.name}
                            className="flex items-center justify-between rounded-lg border border-brown/30 bg-brown/10 px-3.5 py-2"
                          >
                            <span className="text-sm font-semibold text-sand">{tech.name}</span>
                            <span className="text-xs text-tan/70">{tech.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg bg-tan px-4 py-2 text-sm font-semibold text-carafe transition-all hover:bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-tan"
                      >
                        Got it
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </main>

      <Footer />
    </div>
  );
}